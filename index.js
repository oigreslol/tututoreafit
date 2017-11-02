//Bloque de variables que se requieren como modulos en el programa
var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');
var mysqlSync = require('sync-mysql');
var formidable = require('formidable');
const cookieParser = require('cookie-parser');
var session = require('express-session');
var MemoryStore = require('memorystore')(session);
var fs = require('fs');
const path = require('path');
var bcrypt = require('bcrypt');
var randomstring = require('randomstring');
var nodemailer = require('nodemailer');
//var MemoryStore = require('connect').session.MemoryStore;
var app = express();


//Vairables de informacion necesarias para el programa
const saltRounds = 10; // Numero de potencia de incriptacion del bcrypt
var estudiante= [];


//Permite obtener acceso a el cuerpo de los formularios
var urlencodedParser = bodyParser.urlencoded({ extended: false });
//Puerto local donde se corre el programa
const PORT = 9001;
/*Inicialización y definición de la conexión a la base de datos de manera
sincrona*/
var connection = new mysqlSync({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'tututor',
  port: 3306
});
/*Inicialización y definición de la conexión ciclica a la base de datos de
manera asincrona*/
var pool = mysql.createPool({
   host: 'localhost',
   user: 'root',
   password: '',
   database: 'tututor',
   port: 3306
});
//Funcion que permite leer mas de 1 carpeta de views
function enableMultipleViewFolders(express) {
    // proxy function to the default view lookup
    var lookupProxy =  function (view, options) {
        if (options.root instanceof Array) {
            // clones the options object
            var opts = {};
            for (var key in options) opts[key] = options[key];
            // loops through the paths and tries to match the view
            var matchedView = null,
                roots = opts.root;
            for (var i=0; i<roots.length; i++) {
                opts.root = roots[i];
                matchedView = lookupProxy.call(this, view, opts);
                if (matchedView.exists) break;
            }
            return matchedView;
        }

        return lookupProxy.call(express.view, view, options)
    };
}
enableMultipleViewFolders(express); //corremos la funcion de multi carpeta views
//funcion que se encarga de copiar un archivo
function copyFile(src, dest) {
  let readStream = fs.createReadStream(src); //creamos el archivo de la direccion
  readStream.once('error', (err) => {
    console.log(err);
  });
  readStream.once('end', () => {
  });
  readStream.pipe(fs.createWriteStream(dest));//pegamos el archivo en la direccion de destino
}
/*Comprueba si el estudiante y/o el correo se encuentra disponible*/
function comprobar(tam,tipo) {
  console.log(tam);
  if (tam > 0){
    throw new TypeError(tipo + " no disponible");
  }
}
//Definición de todos los documentos estáticos
app.use('ejs', express.static(__dirname + '/views'));
app.use('ejs', express.static(__dirname + '/pag/views'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/js', express.static(__dirname + '/pag/js'));
app.use('/images', express.static(__dirname + '/images'));
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use('/images', express.static(__dirname + '/pag/images'));
app.set('view engine','ejs');
app.set('views', [__dirname + '/views', __dirname + '/pag/views']);
app.use('/css',express.static('css'));
app.use('/css',express.static('pag/css'));
app.use(cookieParser());
app.use(session({
    secret: 'keyboard cat',
   store: new MemoryStore({reapInterval: 60000 * 10}),
    resave: false,
    saveUninitialized: true
})) //Hacemos que la aplicacion use el sistema de sessiones

/*Métodos que se encarga de renderizar una pagina cuando esta se recibe en la
barra de navegación*/
//cuando entren solo la direccion principal
app.get('/', function(req, res){
  if(req.session.usuario){
    res.render('perfil',{nombre:req.session.usuario, foto: "../../uploads/" + req.session.usuario + "/perfil.jpg ",info:req.session.informacion});
  }else {
    res.render('index', {
        mensaje:false
    });
  }
});
// Cuando ingresamos al index ejs
app.get('/index.ejs', function(req, res){
    res.render('index', {
        mensaje:''
    });
});

function perfilComprobar(usuario) {
  var rutUplo = 'uploads';
  let filename = 'perfil.jpg';
  if (!fs.existsSync(rutUplo)){ // si no existe la carpeta 'Uploads'
    fs.mkdirSync(rutUplo); // crea la carpeta 'Uploads'
  }
  if(!fs.existsSync('./uploads/' +usuario)){ // si no existe la carpeta 'uploads' + la carpeta con el nombre del estudiante
      fs.mkdirSync('./uploads/' +usuario); // crea la carpeta con el nombre del estudiante
      copyFile(__dirname + '/images/perfil.jpg', path.join(__dirname +'/uploads/' +usuario, filename)); // copiamos dentro de ella lo foto por defecto
  }
  return 0;
    //renderizamos el perfil
}
//Cuando entran al perfil
app.get('/perfil.ejs',function(req,res){
  if(req.session.usuario){
    if(req.session.informacion.id == "tutor"){ //si hay un estudiante inicado
        var a = perfilComprobar(req.session.usuario);

        if(a == 0){
          console.log("ENTRO A MONITOR");
          var sql_string2 = "SELECT * FROM pregunta";
          pool.getConnection(function(err, con){//Llamado a una conexión asincrona
            if(err){
              con.release();
              throw err;
            }
            con.query(sql_string2, function (err2, res2) {
              con.release();
              res.render('perfil',{preguntas:res2, nombre:req.session.usuario, foto: "../../uploads/" + req.session.usuario + "/perfil.jpg ",info: req.session.informacion});
              if(err2) throw err2;
            });
          });
        }
    }else{
      a =  perfilComprobar(req.session.usuario);
      if(a==0){
          res.render('perfil',{nombre:req.session.usuario, foto: "../../uploads/" + req.session.usuario + "/perfil.jpg ",info: req.session.informacion});
      }
    }
  }else{
    //si no hay ninguna session iniciada redireccionamos a la pantalla de logeo
    res.redirect('index.ejs');
  }
});

//Cuando ingresemos al index de la pagina normal
app.get('/index2.ejs',function(req,res){
  res.render('../pag/views/index2',{login:true,
  perfil:"Bienvenido " + req.session.usuario + " Has iniciado sesion " });
});
//cuando ingresamos al index desde otra pagina que no sea la de logeo
  app.get('/pag/views/index2.ejs', function(req, res){
  if(req.session.usuario){
        res.redirect('/perfil.ejs');
      }else{
      res.redirect('../../../index.ejs');
    }
});
function loginU(tipo,data){
  sql_string = "SELECT * FROM "+tipo+" WHERE usuario = '" + data.usuario + "'";
  var result = connection.query(sql_string);
  if(result.length>0){
    if(bcrypt.compareSync(data.password, result[0].contra)){
      if(result[0].verificado == 1){
        return 1;
      }else {
      return 2;
      }
      //Aquí se debe llevar a la pagina de inicio. FALTA!!
    }else{
      return 3;
    }
  }else{
    return 4;
  }
}

function comprobarURL(tipo,url) {
  sql_string = "SELECT usuario FROM "+tipo+" WHERE url = '" + url + "'";
  var result = connection.query(sql_string);
  if(result.length != 0){
    sql_string = "UPDATE "+tipo+
                 " SET verificado = 1, url = ''"+
                 "WHERE usuario = '" + result[0].usuario + "'"; // Actualiza el estudiante como verificado
    var result2 = connection.query(sql_string);
    return 0;
  }else{
    return 1;
  }
}
//Recibe todo lo que termine con verify
app.get(/.*verify$/, function (req, res) {
  var comprobar = comprobarURL("estudiante",""+req.url);
    if(comprobar == 0){
      res.render('index', {mensaje:'Su cuenta ha sido verificada exitosamente'}); // verifica exitosamente al estudiante
    }
    if(comprobar == 1){
      comprobar = comprobarURL("tutor",""+req.url);
      if(comprobar==0){
        res.render('index', {mensaje:'Su cuenta ha sido verificada exitosamente'}); // verifica exitosamente al estudiante
      }if(comprobar == 1){
        res.render('index', {
            mensaje:'Esta url NO EXISTE'
        }); // la url puesta no existe
      }
    }
});
function registro(usuario,data){
  if (data.Email) {
    var disponible =  true; //Variable usada para continuar la verificación
    var sql_string = "SELECT usuario FROM "+usuario+" WHERE usuario = '" + data.usuario + "'";
    var result = connection.query(sql_string);
    try{
      comprobar(result.length, "Usuario");
    }catch(err){
      disponible = false;//Si el estudiante existe, no se continua la verificación
      console.log(err.message);
      return 1;
    }
    if(disponible){//Entra cuando el estudiante es disponible
      sql_string = "SELECT correo FROM " + usuario+" WHERE correo = '" + data.Email + "'";
      var result2 = connection.query(sql_string);
      try{
        comprobar(result2.length, "Email");
      }catch(err){
        disponible = false;//Si el email existe, no se continua la verificación
        console.log(err.message);
        if(err.message == "Email no disponible"){
          return 2;
        }
      }
    }
    if (disponible){//Entra cuando el estudiante y el email estan disponibles
      var salt = bcrypt.genSaltSync(saltRounds);
      var hash = bcrypt.hashSync(data.Password[0], salt);
      //Se crea el link para enviar al correo del estudiante
        var linkr = "/" + randomstring.generate(15) + "verify";
        var sql_string2 = "INSERT INTO "+usuario+" (usuario, nombre, apellido, correo, contra, carnet, verificado, url) VALUES ('" +
        data.usuario + "', '" + data.nombre + "', '" + data.apellido + "', '" + data.Email + "', '" + hash + "', '" + data.carnet + "', 0, '" + linkr + "')";
        pool.getConnection(function(err, con){//Llamado a una conexión asincrona
        if(err){
          con.release();
          throw err;
        }
        con.query(sql_string2, function(err2, res2) {
          con.release();
          if(err2) throw err2;
        });
      });

      var smtpTransport = nodemailer.createTransport({
        service: "Gmail",
          auth: {
              user: "tututoreafit@gmail.com",
              pass: "elchecoeslovaco123"
          }
        });
      // setup e-mail data with unicode symbols
      var mailOptions = {
            from: "Tututor✔ <tututoreafit@gmail.com>", // sender address
            to: data.Email+"", // list of receivers
            subject: "Bienvenido a Tututor", // Subject line
            text: "",
            html: "<h1>Hola " + data.usuario + ". </h1> <br> <p>Bienvenido a Tututor, para terminar tu" +
            " proceso de registro, por favor da clic en el siguiente enlace: </a> <a>localhost:8080" + linkr +"</a>" +
            "<br> <a> Si cree que no debio recibir este correo pruede ingresar a nuestra pagina y hacer su reclamo:</a>"+
            " localhost:8080/"
        }

        // send mail with defined transport object
        smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
                console.log(error);
            }else{
                console.log("Mensaje enviado");
            }

            // if you don't want to use this transport object anymore, uncomment following line
            smtpTransport.close(); // shut down the connection pool, no more messages
        });
    return 0;
    }
  }
}
/*Es como un tipo de listener que se activa cuado se es enviado un formulario,
este se encarga de realizar las consultas necesarias para la validación de los
datos*/
app.post('/', urlencodedParser, function(req, res){
  var data = req.body;
  if(data.codigo){
    var sql_string = "SELECT codigo FROM codigo WHERE codigo = '" + data.codigo + "'";
    var result = connection.query(sql_string);
    if(result.length > 0){
      var respuesta = registro("tutor",data);
      if(respuesta ==0){
        res.render('index', {mensaje:'Su registro ha sido completado exitosamente'  });
      }
      if(respuesta == 1){
        res.render('index', {mensaje:'Lo sentimos pero este nombre de estudiante no se encuentra disponible.'  });
      }
      if(respuesta == 2){
        res.render('index', {//Se le envia un mensaje de error diciendo que el correo no es admitido
          mensaje:'Lo sentimos pero esta dirección de email no se encuentra disponible.'
        });
      }
    }
  }else{
    var respuesta = registro("estudiante",data);
    if(respuesta ==0){
      res.render('index', {mensaje:'Su registro ha sido completado exitosamente'  });
    }
    if(respuesta == 1){
      res.render('index', {mensaje:'Lo sentimos pero este nombre de estudiante no se encuentra disponible.'  });
    }
    if(respuesta == 2){
      res.render('index', {//Se le envia un mensaje de error diciendo que el correo no es admitido
        mensaje:'Lo sentimos pero esta dirección de email no se encuentra disponible.'});
    }
  }
  if(!data.Email){
    var login = loginU("estudiante",data);
    if(login == 1){
        req.session.usuario = req.body.usuario;
        sql_string = "SELECT * FROM estudiante WHERE usuario = '" + data.usuario + "'";
          var result2 = connection.query(sql_string);
        req.session.informacion =  { name:req.session.usuario, correo: result2[0].correo, carrera: '', nombre: result2[0].nombre, apellido:result2[0].apellido, carnet : result2[0].carnet, id : "estudiante" ,idE : result2[0].idEstudiante};
      res.render('../pag/views/index2.ejs', {login:true,perfil:"Bienvenido " + req.session.usuario + " Se ha inciado sesion correctamente"});
    }
    if(login == 2){
      res.render('index', {mensaje:'Debe verificar su cuenta primero para poder entrar'});
    }
    if(login == 3){
      res.render('index',{mensaje:"Usuario o contraseña incorrecta"});
    }
    if(login == 4){
      login = loginU("tutor",data);
      if(login == 1){
        req.session.usuario = req.body.usuario;
        sql_string = "SELECT * FROM tutor WHERE usuario = '" + data.usuario + "'";
        var result2 = connection.query(sql_string);
        req.session.informacion =  { name:req.session.usuario, correo: result2[0].correo, carrera: '', nombre: result2[0].nombre, apellido:result2[0].apellido, carnet : result2[0].carnet, id :"tutor" };
        res.render('../pag/views/index2.ejs', {login:true,perfil:"Bienvenido " + req.session.usuario + " Se ha inciado sesion correctamente"});
      }
      if(login == 2){
        res.render('index', {mensaje:'Debe verificar su cuenta primero para poder entrar'});
      }
      if(login == 3){
        res.render('index',{mensaje:"Usuario o contraseña incorrecta"});
      }if(login == 4){
        res.render('index',{mensaje:"Este usuario no existe"});
      }
    }
  }
});
app.post('/cambiar', urlencodedParser, function(req, res){
  sql_string = "SELECT * FROM " +req.session.informacion.id+ " WHERE usuario = '" + req.session.usuario + "'";
  var result = connection.query(sql_string);
  if(bcrypt.compareSync(req.body.contraA, result[0].contra)){
    if(req.body.nuevaC != req.body.contraA){
      var salt = bcrypt.genSaltSync(saltRounds);
      var hash = bcrypt.hashSync(req.body.nuevaC, salt);
      sql_string = "UPDATE estudiante "+
                   "SET contra = '" + hash +"' "+
                   "WHERE usuario = '" + result[0].usuario+ "'" ;
      var result2 = connection.query(sql_string);
      res.render('perfil',{nombre:"Contraseña exitosamente cambiada", foto: "../../uploads/" + req.session.usuario + "/perfil.jpg ",info: req.session.informacion});
    }else{
      res.render('perfil',{nombre:"La contraseña ingresada no puede ser igual a la anterior", foto: "../../uploads/" + req.session.usuario + "/perfil.jpg ",info: req.session.informacion});
    }
  }else{
    res.render('perfil',{nombre:"No ha ingresado su contraseña anterior", foto: "../../uploads/" + req.session.usuario + "/perfil.jpg ",info: req.session.informacion});
  }
});
//POST que se encarga del cambio de foto
app.post('/foto', function (req, res){
  var form = new formidable.IncomingForm(); //usamos formidable para el upload del archivo
  form.parse(req);
  form.on('fileBegin', function (name, file){ // cuando el archcivo este subiendo
    if(path.extname(file.name) == '.jpg' || path.extname(file.name) == '.png' || path.extname(file.name) == '.gif'){
      fs.unlinkSync(__dirname + '/uploads/' + req.session.usuario + '/perfil.jpg'); // borramos la imagen de perfil anterior
      file.path = __dirname + '/uploads/' + req.session.usuario +'/perfil.jpg' ; // ponemos el archivo en la carpeta del estudiante
    }else {
      res.render('perfil',{nombre:"El archivo no es un formato de foto valido", foto: "../../uploads/" + req.session.usuario + "/perfil.jpg ",info:req.session.informacion});
    }
  });
  res.render('perfil',{nombre:req.session.usuario, foto: "../../uploads/" + req.session.usuario + "/perfil.jpg ",info:req.session.informacion});
});
// Funcion para cerrar sesion
app.post('/cerrar',function(req,res){
  req.session.destroy(function(err) {
    if(err) {
      console.log(err);
    } else {
      res.redirect('/');
    }
  });
});
app.post('/preguntaN',urlencodedParser ,function(req,res){

  var sql_string2 = "INSERT INTO pregunta (idEstudiante, Titulo, tema, contexto, estado) VALUES (" +
  req.session.informacion.idE + ", '" + req.body.nombreP + "', '" + req.body.tema + "', '" + req.body.textoP + "', 0 " + ")";
  console.log(sql_string2);
  var result = connection.query(sql_string2);
  res.redirect('/perfil.ejs');
});
//Se corre el programa en el PORT definido anteriormente.
//app.listen(PORT);
var listener = app.listen(PORT, function () {
   console.log('Server started on port %d', listener.address().port);
});
