module.exports = function(grunt) {

    var pack = require("./package.json");

    grunt.initConfig({
        jshint: {
            files: ['widget.js', 'test.js'],
            options: {
                esversion: 6,
                eqeqeq: true, // no == or !=
                immed: true, // forces () around directly called functions
                latedef: "nofunc", // makes it impossible to use a variable before it is declared
                newcap: true, // force capitalized constructors
                strict: true, // enforce strict mode
                trailing: true, // trailing whitespaces are ugly
                maxlen: 120, // maximum characters per line
                camelcase: true, // force camelCase
            },
        },
        mocha: {
            main: {
                src: ['test.html'],
                options: {
                    log: true,
                    reporter: "Nyan",
                    run: true,
                },
            }
        },
        mochaTest: {
            main: {
                src: ['test.js'],
                options: {
                    ui: "qunit",
                }
            }
        },
        babel: {
            options: {
                sourceMap: true,
                presets: ['es2015'],
            },
            dist: {
                files: {
                    'widget.babelized.js': 'widget.js'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-babel');
    
    grunt.registerTask('gen', ['babel']);

    grunt.registerTask('default', ['gen', 'jshint'/*, "mocha", "mochaTest"*/]);

};
