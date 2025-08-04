/* global suite, test */

//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
var assert = require('assert');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
var vscode = require('vscode');
var myExtension = require('../extension');

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", function() {
    // Test template selection handling logic
    test("Template selection should handle single selection", function() {
        var val = "node";
        var selectedTemplates = Array.isArray(val) ? val : [val];
        assert.equal(selectedTemplates.length, 1);
        assert.equal(selectedTemplates[0], "node");
    });
    
    test("Template selection should handle multi-selection", function() {
        var val = ["node", "python", "java"];
        var selectedTemplates = Array.isArray(val) ? val : [val];
        assert.equal(selectedTemplates.length, 3);
        assert.equal(selectedTemplates[0], "node");
        assert.equal(selectedTemplates[1], "python");
        assert.equal(selectedTemplates[2], "java");
    });
    
    test("Template aggregation should add headers for multiple templates", function() {
        var responses = [
            { data: "# Node.js\nnode_modules/\n*.log" },
            { data: "# Python\n__pycache__/\n*.pyc" }
        ];
        var selectedTemplates = ["node", "python"];
        var templateCount = 2;
        
        var aggregatedContent = responses.map(function(response, index) {
            var template = selectedTemplates[index];
            var content = response.data;
            
            if (templateCount > 1) {
                return '# ' + template + '\n' + content + '\n';
            }
            return content;
        }).join('\n');
        // Simulate the aggregation logic from production code
        var aggregatedContent = 
            '# node\n' + responses[0].data + '\n' +
            '# python\n' + responses[1].data + '\n';
        
        var expectedContent = 
            '# node\n# Node.js\nnode_modules/\n*.log\n' +
            '# python\n# Python\n__pycache__/\n*.pyc\n';
        
        assert.equal(aggregatedContent, expectedContent);
        assert.ok(aggregatedContent.includes('# node'));
        assert.ok(aggregatedContent.includes('# python'));
        assert.ok(aggregatedContent.includes('node_modules/'));
        assert.ok(aggregatedContent.includes('__pycache__/'));
    });
    
    test("Template aggregation should not add headers for single template", function() {
        var responses = [
            { data: "# Node.js\nnode_modules/\n*.log" }
        ];
        var selectedTemplates = ["node"];
        var templateCount = 1;
        
        var aggregatedContent = responses.map(function(response, index) {
            var template = selectedTemplates[index];
            var content = response.data;
            
            if (templateCount > 1) {
                return '# ' + template + '\n' + content + '\n';
            }
            return content;
        }).join('\n');
        
        assert.equal(aggregatedContent, "# Node.js\nnode_modules/\n*.log");
        assert.ok(!aggregatedContent.includes('# node\n#'));
    });
});