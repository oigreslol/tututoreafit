function comprobarClave() {
  var clave1 = document.getElementById('password1').value;
  var clave2 = document.getElementById('password2').value;
  var correo = document.getElementById('email').value;
  var nombre = document.getElementById('nombre').value;
  var apellido = document.getElementById('apellido').value;
  var carnet = document.getElementById('carnet').value;
  var codigo = document.getElementById('codigo').value;


  for (var i = 0; i < clave1.length; i++) {
    console.log(clave1.charAt(i));
    if (clave1.charAt(i) == ' '){
      alert("La contraseña no puede tener espacios");
      return false;
    }
  }

for (var i = 0; i < nombre.length; i++) {
  if(nombre.charCodeAt(i) != 32 ){
    if(nombre.charCodeAt(i)<160 && nombre.charCodeAt(i)>165){
      if(nombre.charCodeAt(i) < 65 || nombre.charCodeAt(i) > 123 || (nombre.charCodeAt(i) > 90 && nombre.charCodeAt(i) < 97)){
        alert("Tu nombre no puede tener numeros");
        return false;
      }
    }
  }
}

for (var i = 0; i < apellido.length; i++) {
  if(apellido.charCodeAt(i) != 32 ){
    if(apellido.charCodeAt(i)<160 && apellido.charCodeAt(i)>165){
      if(apellido.charCodeAt(i) < 65 || apellido.charCodeAt(i) > 123 || (apellido.charCodeAt(i) > 90 && apellido.charCodeAt(i) < 97)){
        alert("Tu apellido no puede tener numeros");
        return false;
      }
    }
  }
}

  for (var i = 0; i < correo.length; i++) {
      if(correo.charAt(i) == '@'){
        var eafit = 'eafit.edu.co';
        var posicion = 0;
        for(var s = i+1; s < correo.length;s++){
          if(correo.charAt(s) != eafit.charAt(posicion)){
            alert("El correo debe ser de EAFIT");
            return false;
          }
          posicion++;
        }
      }
  }

  if (clave1 != clave2){
    alert("Las contraseñas no coinciden");
    return false;
  }
  return true;
}
