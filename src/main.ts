#!/usr/bin/env node

import { execSync } from 'child_process';

// Contributions to the Evergreen ILS project must be made in the working git repository.
// This function checks to see if there is a remote repository available to push to.
// The URL of the working repository is git://git.evergreen-ils.org/working/Evergreen.git.
function checkForWorkingRemote() {
	// Get a list of all remote urls:
	const remoteUrls = execSync('git remote -v').toString();
	console.log(remoteUrls);
	// Check if the working repository is among the remote urls:
	const workingRemote = remoteUrls.includes
		('git://git.evergreen-ils.org/working/Evergreen.git');
	return workingRemote;

}