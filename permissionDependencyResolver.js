var tsort = require('tsort') // HINT!!! This is a useful package for one of the methods

let dependencyStructure;

/* Helper functions*/
function removePermission(existing, permission){
	let index = existing.indexOf(permission) 
	if(index > -1){
		existing.splice(index, 1);
	}
	return existing;
}

function getPermissionNodes(permission){
	for(let dependencyNameIndex=0; dependencyNameIndex < dependencyStructure.length; dependencyNameIndex++){
		if(dependencyStructure[dependencyNameIndex].id === permission){
			return dependencyStructure[dependencyNameIndex].nodes;
		}
	}
	return undefined;
}

function unwrapParentPremissions(permission){
	let allPermissions = getPermissionNodes(permission);
	
	for(let index = 0; index < allPermissions.length; index++){
		let parentPremissions = getPermissionNodes(allPermissions[index]);
		allPermissions.push(... parentPremissions);
		allPermissions = [... new Set(allPermissions)];
	}
	return allPermissions
}

function areBasePermissions(existingPermission){
	let allPermissions = [];
	allPermissions.push(...existingPermission);
	for(let index = 0; index < existingPermission.length; index++){
		let parentNodes = unwrapParentPremissions(existingPermission[index])
		allPermissions.push(... parentNodes);
		allPermissions = [... new Set(allPermissions)];
	}
	return allPermissions.length == existingPermission.length;
}


/*Public class functions*/
function PermissionDependencyResolver (dependencies) {
	
	dependencyStructure = [];
	
	for (let property in dependencies) {
		let element = {};
		element.id = property;
		element.nodes = dependencies[property];
		dependencyStructure.push(element);
	}
}


PermissionDependencyResolver.prototype.canGrant = function(existing, permToBeGranted) {
	
	if(!areBasePermissions(existing)){
		let err = new InvalidBasePermissionsError();
		throw err;
	}
	
	let permsNeedForGrant = unwrapParentPremissions(permToBeGranted);
	
	for(let neededPermIndex = 0; neededPermIndex<permsNeedForGrant.length; neededPermIndex++){
		if(!existing.includes(permsNeedForGrant[neededPermIndex])){
			return false;
		}
	}
	return true;
}

PermissionDependencyResolver.prototype.canDeny = function(existing, permToBeDenied) {
	if(!areBasePermissions(existing)){
		let err = new InvalidBasePermissionsError();
		throw err;
	}
	
	try{
		existing = removePermission(existing,permToBeDenied);
		for(let remainingDependIndex = 0; remainingDependIndex<existing.length; remainingDependIndex++){
			let remainingDependacies = unwrapParentPremissions(existing[remainingDependIndex]);
			if(remainingDependacies.includes(permToBeDenied)){
				return false;
			}
		}
		return true;
	}catch(err){
		return false;
	}
}

PermissionDependencyResolver.prototype.sort = function(permissions) {
		
	let permissionsGraph = tsort();
	for(let index=0; index<permissions.length;index++){
		let childNodes = getPermissionNodes(permissions[index]);
		for(let childIndex = 0; childIndex < childNodes.length; childIndex++){
			permissionsGraph.add(childNodes[childIndex],permissions[index]);
		}
	}
	
	return permissionsGraph.sort();
}

// you'll need to throw this in canGrant and canDeny when the existing permissions are invalid
function InvalidBasePermissionsError() {
  this.name = 'InvalidBasePermissionsError'
  this.message = "Invalid Base Permissions"
  this.stack = Error().stack;
}
InvalidBasePermissionsError.prototype = new Error()

module.exports = PermissionDependencyResolver
