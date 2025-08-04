/* jshint esversion: 6 */
var fs = require('fs');
var path = require('path');

var vscode = require('vscode');
var axios = require('axios');
var errorEx = require('error-ex');

function activate(context) {
    console.log('Extension "gi" is now active!');

    var disposable = vscode.commands.registerCommand('extension.gi', function () {
        var giURL = 'https://www.gitignore.io/api/';
        var giError = new errorEx('giError');

        axios.get(giURL + 'list')
            .then(function (response) {
                var rawList = response.data;
                rawList = rawList.replace(/(\r\n|\n|\r)/gm, ",");
                var formattedList = rawList.split(',');

                const options = {
                    ignoreFocusOut: false,
                    placeHolder: 'Search Operating Systems, IDEs, or Programming Languages',
                    canPickMany: true, // Enable multi-selection for gitignore templates
                };

                vscode.window.showQuickPick(formattedList, options)
                    .then(function (val) {
                        if (val === undefined || (Array.isArray(val) && val.length === 0)) {
                            vscode.window.setStatusBarMessage('gi escaped', 3000);
                            var err = new giError('EscapeException');
                            throw err;
                        }
                        
                        // Handle both single selection (backward compatibility) and multi-selection
                        var selectedTemplates = Array.isArray(val) ? val : [val];
                        var templateCount = selectedTemplates.length;
                        
                        if (templateCount === 1) {
                            vscode.window.setStatusBarMessage('You picked ' + selectedTemplates[0], 3000);
                        } else {
                            vscode.window.setStatusBarMessage('You picked ' + templateCount + ' templates: ' + selectedTemplates.join(', '), 3000);
                        }
                        
                        // Fetch content for all selected templates
                        var templatePromises = selectedTemplates.map(function(template) {
                            return axios.get(giURL + template);
                        });
                        
                        // Wait for all template requests to complete
                        Promise.all(templatePromises)
                            .then(function(responses) {
                                // Aggregate all .gitignore content from selected templates
                                var aggregatedContent = responses.map(function(response, index) {
                                    var template = selectedTemplates[index];
                                    var content = response.data;
                                    
                                    // Add a header comment if multiple templates were selected
                                    if (templateCount > 1) {
                                        return '# ' + template + '\n' + content + '\n';
                                    }
                                    return content;
                                }).join('');
                                
                                makeFile(aggregatedContent);
                            })
                            .catch(function (err) {
                                console.log(err);
                                vscode.window.showErrorMessage('Failed to fetch gitignore templates');
                            });
                    });

                function makeFile(content) {
                    const choices = [{
                        label: 'Append',
                        description: 'Append to current .gitignore'
                    }, {
                        label: 'Overwrite',
                        description: `Overwrite current .gitignore`
                    }];

                    const options = {
                        matchOnDescription: true,
                        placeHolder: "A .gitignore file already exists in your current working directory. What would you like to do?"
                    };

                    var giFile = path.join(vscode.workspace.rootPath, '.gitignore');

                    fs.access(giFile, fs.F_OK, function (err) {
                        if (!err) {
                            console.log('.gitignore already exists');
                            vscode.window.showQuickPick(choices, options)
                                .then(function (val) {
                                    if (!val || val === undefined) {
                                        var err = new giError('EscapeException');
                                        vscode.window.setStatusBarMessage('gi escaped', 3000);
                                        throw err;
                                    }
                                    if (val.label === 'Overwrite') {
                                        writeToFile(content, true);
                                        vscode.window.showInformationMessage('.gitignore overwritten');
                                        return;
                                    }
                                    if (val.label === 'Append') {
                                        writeToFile(content, false);
                                        vscode.window.showInformationMessage('.gitignore appended');
                                        return;
                                    }
                                });
                        } else {
                            console.log('.gitignore does not exist');
                            writeToFile(content, true);
                            vscode.window.showInformationMessage('.gitignore created');
                            return;
                        }
                    });

                    function writeToFile(content, flag) {
                        if (flag === true) {
                            fs.writeFileSync(giFile, content, 'utf-8', function (err) {
                                if (err) {
                                    console.log('Failed to write to .gitignore');
                                } else {
                                    console.log('.gitignore created');
                                }
                            });
                        } else {
                            fs.appendFileSync(giFile, content, 'utf-8', function (err) {
                                if (err) {
                                    console.log('Failed to append to .gitignore');
                                } else {
                                    console.log('.gitignore appended');
                                }
                            });
                        }
                    }
                }
            })
            .catch(function (err) {
                console.log(err);
            });
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;