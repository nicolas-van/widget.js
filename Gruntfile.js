module.exports = function(grunt) {

    var pack = require("./package.json");

    grunt.initConfig({
        jshint: {
            files: ['widget.js'],
            options: {
                esversion: 5,
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
        babel: {
            options: {
                sourceMap: true,
                presets: ['env'],
            },
            main: {
                files: {
                    'test.babelized.js': 'test.js'
                }
            },
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-mocha');

    grunt.registerTask('gen', ['jshint', 'babel']);

    grunt.registerTask('test', ['gen', 'mocha']);

    grunt.registerTask('default', ['gen']);

};
