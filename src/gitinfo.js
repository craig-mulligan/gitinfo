import fs from 'fs';
import path from 'path';
import utils from './utils';

/**
 * @typedef config
 * @property {string} gitPath Path to the .git directory (default: __dirname).
 */

/**
 * @param {config} config
 * @returns {Object}
 */
export default (config = {}) => {
    let gitPath,
        gitinfo;

    config.gitPath = config.gitPath || __dirname;

    gitinfo = {};

    /**
     * @return {string} Repository URL.
     */
    gitinfo.url = () => {
        return 'https://github.com/' + gitinfo.username() + '/' + gitinfo.name();
    };

    /**
     * Gets name of the current branch.
     *
     * @see http://stackoverflow.com/a/12142066/368691
     * @return {string}
     */
    gitinfo.branch = () => {
        let branch,
            head,
            name;

        name = gitPath + '/HEAD';

        if (!fs.existsSync(name)) {
            throw new Error('Git HEAD ("' + name + '") does not exist.');
        }

        head = fs.readFileSync(name, {encoding: 'utf8'});

        branch = head.match(/^ref: refs\/heads\/(.*)$/m);

        if (!branch) {
            throw new Error('Cannot get the current branch name.');
        }

        return branch[1];
    };

    /**
     * Get the remote URL of the current branch.
     *
     * @return {string}
     */
    gitinfo.remoteURL = () => {
        let branch,
            branchName,
            config,
            remote;

        branchName = gitinfo.branch();
        config = gitinfo.config();

        branch = config['branch "' + branchName + '"'];

        if (!branch) {
            throw new Error('Branch ("' + branchName + '") definition does not exist in the config.');
        } else if (!branch.remote) {
            throw new Error('Branch ("' + branchName + '") does not define "remote".');
        }

        remote = config['remote "' + branch.remote + '"'];

        if (!remote) {
            throw new Error('Remote ("' + branch.remote + '") definition does not exist in the config.');
        } else if (!remote.url) {
            throw new Error('Remote ("' + branch.remote + '") does not define "url".');
        }

        return remote.url;
    };

    /**
     * @return {string} Absolute path to the .git/ directory.
     */
    gitinfo.gitPath = () => {
        return gitPath;
    };

    /**
     * @return {string} Username of the repository author.
     */
    gitinfo.username = () => {
        return utils.parseRemoteOriginURL(gitinfo.remoteURL()).username;
    };

    /**
     * @return {string} Repository name.
     */
    gitinfo.name = () => {
        return utils.parseRemoteOriginURL(gitinfo.remoteURL()).name;
    };

    /**
     * @returns {string} Commit SHA of the current branch
     */
    gitinfo.sha = () => {
        let branch,
            sha,
            shaFile;

        branch = gitinfo.branch();
        shaFile = path.join(gitPath, 'refs', 'heads', branch);

        try {
            sha = fs.readFileSync(shaFile, {encoding: 'utf8'});
        } catch (err) {
            throw new Error('Cannot read the commit SHA of the current HEAD from the ' + shaFile + '.\n' + err);
        }
        return utils.trim(sha);
    };

    /**
     * Get object representation of the .git/config file.
     *
     * @returns {Object}
     */
    gitinfo.config = () => {
        return utils.parseINI(gitPath + '/config');
    };

    if (utils.isGitDirectory(config.gitPath)) {
        gitPath = config.gitPath;
    } else {
        gitPath = utils.gitPath(config.gitPath);
    }

    if (!gitPath) {
        throw new Error('config.gitPath is not a descendant of .git/ director.');
    }

    return gitinfo;
};
