module.exports = function(grunt){

  require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    uncss: {
      dist: {
        src: ['Build/model-data.html', 'Build/index.html', 'Build/model-menu.html', 'Build/view-car.html'],
        dest: 'assets/styles/toyota-estest.css'
      }
    }
  });

  grunt.registerTask('default', []);

};