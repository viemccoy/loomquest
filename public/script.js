$(document).ready(function() {
  $('#terminal').terminal(function(command) {
    if (command !== '') {
      try {
        var result = window.eval(command);
        if (result !== undefined) {
          this.echo(new String(result));
        }
      } catch(e) {
        this.error(new String(e));
      }
    } else {
      this.echo('');
    }
  }, {
    greetings: 'JavaScript Interpreter',
    name: 'js_demo',
    height: 200,
    prompt: 'LOOMQUEST> '
  });
});