module.exports = function(grunt){

  require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    uncss: {
      dist: {
        src: ['build/model-data.html', 'build/index.html'],
        dest: 'build/assets/styles/toyota-estest.css',
        options: {
          report:'min'
        }
      }
    }
  });

  grunt.registerTask('default', []);

};