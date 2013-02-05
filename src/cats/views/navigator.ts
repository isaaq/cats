//
// Copyright (c) JBaron.  All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

module Cats.View {


export interface ListEntry {
    name: string; // Just the file/directory name without path
    path: string; // fullName including path
	isFolder: bool; // is this a folder or a file
    decorator?:string;
}

// Sort first on directory versus file and then on alphabet
function sort(a:ListEntry,b:ListEntry) {
    if ( (! a.isFolder) && b.isFolder) return 1;
    if (a.isFolder && (! b.isFolder)) return -1;
    if (a.name > b.name) return 1;
    if (b.name > a.name) return -1;
    return 0;
}

/**
 * Reads the contents of a directory. 
 * This class on purpose doesn't walk recursively in order to facilate
 * lazy loading and better performance for large directory structures
 */ 
class DirectoryReader {

    ignore:string[]=["^\."];

	constructor() {
		// @TODO allow to set filter flags
	}

    /**
     * Read a directory and return a sorted list of its content
     * 
     */ 
	read(dir:ListEntry) :ListEntry[] {       

		var files:string[] = FS.readdirSync(dir.path);

		var entries:ListEntry[] = [];

		files.forEach( file => {
            try {
    			var pathName = PATH.join(dir.path,file);
                var isFolder = FS.statSync(pathName).isDirectory();

                // @TODO should not have decorator in here
                entries.push({
                    name: file,
                    path: pathName,
                    isFolder: isFolder,
                    decorator: isFolder? "icon-folder" : "icon-file"
                });
            } catch(err) {
                console.log("Got error while handling file " + pathName);
                console.error(err);
            }
        });

		entries.sort(sort);

        return entries;
	} 
	

}




     export class Navigator extends BaseView {

        
        constructor() {
            super(document.getElementById("filetree")); 
            this.icon = "icon-files";
            this.name = "Files";
            this.initNavigatorView();
        }
    
    
    initNavigatorView() {
            var project = IDE.project;
            if (! project) return;
            
            IDE.fileNavigation.innerHTML = "";
            var fileTree = new Cats.UI.TreeView();
            var dirReader = new DirectoryReader();

            fileTree.setAspect("children", (parent: ListEntry): ListEntry[] => {
                if (parent == null) {
                    return [{
                        name: project.name,
                        isFolder: true,
                        path: project.projectDir,
                        decorator: "icon-folder"
                    }];
                }

                return dirReader.read(parent);

            });

            fileTree.appendTo(IDE.fileNavigation);
            fileTree.refresh();

            fileTree.onselect = (entry) => {
                if (!entry.isFolder) project.editFile(entry.path);
            };
        }

     }
     
}