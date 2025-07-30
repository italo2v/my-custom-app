interface ConfigurationPanel {
  showConfigurationPanel: ()=>void;
  update: ()=>void
}

module.exports = {
  showConfigurationPanel: ()=>{
    $('<div/>', {'class': 'panel mainPanel', 'id': 'configurationPanel', 'style': 'height:'+( ($(window).height()||500)-100)+'px'}).appendTo($body)
    showConfigurationFields()
  },
  update: ()=>{
    var this_config: ViewSystemConfig = getFields()
    var error: string = ''
    if(typeof this_config.mongo_db != 'undefined'){
      if(this_config.mongo_db.host == '')
        error = 'inserthost'
      else if(this_config.mongo_db.port == '')
        error = 'insertport'
      else if(this_config.mongo_db.dbname == '')
        error = 'insertdbname'
    }
    if(typeof this_config.mongo_db != 'undefined' && this_config.mongo_db.dbuser == '' && this_config.mongo_db.dbpassword != '')
      error = 'blankuser'
    else if(typeof this_config.mongo_db != 'undefined' && this_config.mongo_db.dbuser != '' && this_config.mongo_db.dbpassword == '')
      error = 'blankpassword'

    if(error != '')
      box(dataLanguage('alert'), dataLanguage(error))
    else
      //testPassword(this_config, (conf: SystemConfig) => {
        send('update-systemconfig', this_config, 'configupdated', () => {
          sheetPanel.close()
          getSystemConfig()
          var $quit = $('#quitadmin')
          if(typeof this_config.mongo_db != 'undefined' &&
          typeof systemConfig.mongo_db != 'undefined' &&
          (systemConfig.mongo_db.host != this_config.mongo_db.host
           || systemConfig.mongo_db.port != this_config.mongo_db.port
           || systemConfig.mongo_db.dbname != this_config.mongo_db.dbname
           || systemConfig.mongo_db.dbuser != this_config.mongo_db.dbuser
           || systemConfig.mongo_db.dbpassword != this_config.mongo_db.dbpassword))
            $quit.trigger("click")
          else if(typeof this_config.mongo_db == 'undefined' && typeof systemConfig.mongo_db.host != 'undefined')
            $quit.trigger("click")
        })
      //})
  }
}


/*function testPassword(config: SystemConfig, callback: (conf: SystemConfig)=>void){
  if($('#admin_password').val() || $('#admin_password2').val()){
    var error: string = validatePassword(config.admin_password)
    if(!error && config.admin_password != config.admin_password2)
      error = 'passwordmismatch'
    if(error)
      box(dataLanguage('alert'), dataLanguage(error))
    else{
      delete config.admin_password2
      hash(config.admin_password, (password) => {
        config.admin_password = password
        callback(config)
      })
    }
  }else{
    delete config.admin_password
    delete config.admin_password2
      callback(config)
  }
}*/

function getFields(): ViewSystemConfig {
  var this_config: ViewSystemConfig = {
    language: $('#language').val() as string,
    textSize: systemConfig.textSize,
    theme: systemConfig.theme,
    mongo_db: {}
  }
  if($('#database').prop('checked')){
    this_config.mongo_db = {
      'host': $('#host').val() as string,
      'port': $('#port').val() as string,
      'dbname': $('#dbname').val() as string,
      'dbuser': $('#dbuser').val() as string,
      'dbpassword': $('#dbpassword').val() as string
    }
  }
  return this_config
}

function showConfigurationFields(){
    $('#fields').remove()
    var $fields = $('<div/>', {'id': 'fields'}).appendTo($('#configurationPanel'))
    $('<span/>').text(dataLanguage('language')+': ').appendTo($fields)
    var $language = $('<select/>', {'id': 'language'}).val(systemConfig.language).appendTo($fields)
    listLanguages($language, (select)=>{
      select.val(systemConfig.language)
    })
    $('<span/>').text(dataLanguage('database')).attr('style', 'text-transform: uppercase;font-weight: bold;').appendTo($fields)
    $('<br/>').appendTo($fields)
    var $checkBox = $('<input/>', {'id': 'database', 'type': 'checkbox'}).appendTo($fields).on("change", function(){
      var $dbFields = $('#dbfields')
      if($checkBox.prop('checked')){
        if(typeof systemConfig.mongo_db != 'undefined'){
          if(typeof systemConfig.mongo_db.host != 'undefined')
            $('#host').val(systemConfig.mongo_db.host)
          if(typeof systemConfig.mongo_db.port != 'undefined')
            $('#port').val(systemConfig.mongo_db.port)
          if(typeof systemConfig.mongo_db.dbname != 'undefined')
            $('#dbname').val(systemConfig.mongo_db.dbname)
          if(typeof systemConfig.mongo_db.dbuser != 'undefined')
            $('#dbuser').val(systemConfig.mongo_db.dbuser)
          if(typeof systemConfig.mongo_db.dbpassword != 'undefined')
            $('#dbpassword').val(systemConfig.mongo_db.dbpassword)
        }
        $dbFields.show()
      }else{
        $dbFields.hide()
      }
    })
    $('<span/>').text(' '+dataLanguage('enabledb')).appendTo($fields)
    var $dbFields = $('<div/>', {'id': 'dbfields'}).hide().appendTo($fields)
    $('<span/>').text(dataLanguage('host')+': ').appendTo($dbFields)
    $('<input/>', {'id': 'host'}).appendTo($dbFields)
    $('<br/>').appendTo($dbFields)
    $('<span/>').text(dataLanguage('port')+': ').appendTo($dbFields)
    $('<input/>', {'id': 'port', 'class': 'Numbers small'}).appendTo($dbFields)
    $('<br/>').appendTo($dbFields)
    $('<span/>').text(dataLanguage('dbname')+': ').appendTo($dbFields)
    $('<input/>', {'id': 'dbname'}).appendTo($dbFields)
    $('<br/>').appendTo($dbFields)
    $('<span/>').text(dataLanguage('user')+': ').appendTo($dbFields)
    $('<input/>', {'id': 'dbuser'}).appendTo($dbFields)
    $('<span/>').text(dataLanguage('password')+': ').appendTo($dbFields)
    $('<input/>', {'id': 'dbpassword', 'type': 'password'}).appendTo($dbFields)
    $language.trigger("focus")
    if(typeof systemConfig.mongo_db != 'undefined')
      if(typeof systemConfig.mongo_db.host != 'undefined' && typeof systemConfig.mongo_db.port != 'undefined' && typeof systemConfig.mongo_db.dbname != 'undefined')
        $checkBox.trigger("click")
}
