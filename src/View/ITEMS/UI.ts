interface UI {
	shortKeys: ShortKeys;
  alertBox: (message:string)=>void;
  confirmBox: (message:string, callbackYes?: ()=>void)=>void;
  box: (title:string, message:string, yesFunction?: ()=>void)=>void;
  listLanguages: (place: JQuery, callback?: (place:JQuery)=>void)=>void;
  setShortKeys: ()=>void;
}
interface LanguageMenuItem{
	language:string;
	name:string;
	picture?: string;
}
interface ShortKeys {
	[shortKey: string]: ShortKey;
}
interface ShortKey {
	id: string;
	dropdown?: boolean;
}

var closeBoxTimeout: NodeJS.Timeout

module.exports = {
	shortKeys: {},
	alertBox: (message: string)=>{
		module.exports.box(dataLanguage('alert'), message)
	},
	confirmBox: (message: string, callbackYes: ()=>any)=>{
		module.exports.box(dataLanguage('confirm'), message, callbackYes)
	},
	box: (title: string, message: string, yesFunction: ()=>any)=>{
	  //lock the system
    var $lock: JQuery = $('#lock')
	  if($lock.length === 0)
      $lock = $('<div>').attr('id', 'lock').appendTo($body).hide()
    var id: string
	  if(title === dataLanguage('alert')){
	  	id = 'boxAlert'
	  	$('#boxAlert').remove()
	  }else{
	  	id = 'box'
      $lock.show()
	  	$('#box').remove()
	  }
	  var $divBox = $('<div/>', {'class': 'box panel', 'id': id}).appendTo($body)
	  var $title = $('<div/>', {'class': 'title'}).text(title).appendTo($divBox)
	  $('<input/>', {'type': 'button', 'class': 'pull-right'}).val('X').appendTo($title).on("click", function(){
	    $(this).parent().parent().remove()
	    if(title !== dataLanguage('alert'))
        $lock.hide()
	  })
	  var $message = $('<div/>', {'class': 'message'}).html(message).appendTo($divBox)
	  if(title === dataLanguage('alert')){
	    $('<br/>').appendTo($message)
	    $('<button/>', {'class': 'btn btn-primary', 'title': 'ENTER'}).text('OK').appendTo($message).on("click", function(){
	      $(this).parent().parent().remove()
	      if(title !== dataLanguage('alert'))
          $lock.hide()
	    })
	  }
	  if(title === dataLanguage('confirm')){
	    $('<br/>').appendTo($message)
	    $('<button/>', {'class': 'btn btn-primary', 'title': 'ENTER'}).text(dataLanguage('yes')).appendTo($message).on("click", function(){
	      $(this).parent().parent().remove()
        $lock.hide()
	      yesFunction()
	    })
	    $('<button/>', {'class': 'btn btn-primary no', 'title': 'ESC'}).text(dataLanguage('cancel')).appendTo($message).on("click", function(){
	      $(this).parent().parent().remove()
        $lock.hide()
	    })
	  }
	  if(title === dataLanguage('profile') || title === dataLanguage('system')){
      $divBox.attr('style', 'height:300px;width:250px;')
	  }
	  boxSize()
	  if(title === dataLanguage('alert')){
	  	clearTimeout(closeBoxTimeout)
	    closeBoxTimeout = setTimeout( function(){
	  		$('#boxAlert').remove()
	    }, 3000) //closing box after 3 seconds
	  }
	},

	/*boxProfile: ()=>{
	    module.exports.box(dataLanguage('profile'), '')
	    $('#box').attr('id', 'boxProfile')
	    //$('#boxProfile .message').remove()
	    $('#boxProfile .title input').off('click').on("click", function(){
	      $('#boxProfile').remove()
	      $('#lock').hide()
	    })
	    var span = $('<span/>').text(dataLanguage('login')+': ').appendTo($('#boxProfile'))
	    $('<input/>', {'id': 'login', 'type': 'text', 'maxlenght': 50}).appendTo(span)
	    span = $('<span/>').text(dataLanguage('password')+': ').appendTo($('#boxProfile'))
	    $('<input/>', {'id': 'password', 'type': 'password', 'maxlenght': 20, 'style': 'width:100px;'}).appendTo(span)
	    $('<div/>', {'style': 'text-align:center', 'id': 'btnProfile'}).appendTo($('#boxProfile'))
	    $('<button/>', {'id': 'submit', 'class': 'btn btn-primary'}).text(dataLanguage('login')).appendTo($('#btnProfile'))
	    $('<span/>').text('   ').appendTo($('#btnProfile'))
	    $('<button/>', {'id': 'closeBox', 'class': 'btn btn-primary'}).text(dataLanguage('close')).appendTo($('#btnProfile'))

	    $('#closeBox').on("click", function(){
	      $('#boxProfile').remove()
	      $('#lock').hide()
	    })
	    $('#boxProfile input').on("keydown", function(event){
	      var key = event.key;
	      if(key === 'Enter') //enter
	        $('#submit').trigger("click")
	    })
	    $('#submit').on("click", ()=>{
	      var login: string = $('#login').val()+''
	      var passwd: string = $('#password').val()+''
	      if(login === '')
	        module.exports.alertBox(dataLanguage('blankuser'))
	      else if(passwd === '')
	        module.exports.alertBox(dataLanguage('blankpassword'))
	      else
	        hash(passwd, (password: string) => {
	          send('login', {'login': login, 'password': password}, 'authenticated', ()=>{
	            myUser.login = login
	            myUser.password = password
	            mainMenu.defaultMenu()
	            configurationPanel.showConfigurationPanel()
	            $('#update').show().off('click').on("click", configurationPanel.update)
	            $('#close').show()
	            module.exports.setMask()
	          })
	        })
	    })
	    $('#login').trigger("focus")
	},

	boxAdminPassword: ()=>{
	  $('#menu').hide()
	  module.exports.box(dataLanguage('system'), '')
	  $('#box').attr('id', 'boxAdminPassword')
	  $('#boxAdminPassword .title input').remove()
	  $('#boxAdminPassword .message').text(dataLanguage('emptypassword')).attr('class', 'alert alert-warning').attr('style', 'font-weight: bold; text-align: center')
	  $('#boxAdminPassword span').remove()
	  $('#btnProfile').html('')
	  var span = $('<span/>').text(dataLanguage('currentpassword')+': ').appendTo($('#boxAdminPassword'))
	  $('<input/>', {'id': 'currentpassword', 'type': 'password', 'maxlenght': 20, 'class': 'medium'}).appendTo(span)
	  $('#currentpassword').trigger("focus")
	  span = $('<span/>').text(dataLanguage('password')+': ').appendTo($('#boxAdminPassword'))
	  $('<input/>', {'id': 'admin_password', 'type': 'password', 'maxlenght': 20, 'class': 'medium'}).appendTo(span)
	  span = $('<span/>').text(dataLanguage('password')+': ').appendTo($('#boxAdminPassword'))
	  $('<input/>', {'id': 'admin_password2', 'type': 'password', 'maxlenght': 20, 'class': 'medium', 'title': dataLanguage('reenterpassword')}).appendTo(span)
	  $('<br/>').appendTo($('#boxAdminPassword'))
	  var div = $('<div/>', {'class': 'center'}).appendTo($('#boxAdminPassword'))
	  $('<button/>', {'id': 'submit', 'class': 'btn btn-primary'}).text(dataLanguage('register')).appendTo(div).on("click", ()=>{
	    var error = validatePassword($('#admin_password').val())
	    if($('#currentpassword').val() === '')
	      module.exports.alertBox(dataLanguage('blankcurrentpassword'))
	    else if($('#admin_password').val() === '' || $('#admin_password2').val() === '')
	      module.exports.alertBox(dataLanguage('blankpassword'))
	    else if(error)
	      module.exports.alertBox(dataLanguage(error))
	    else if($('#admin_password').val() !== $('#admin_password2').val())
	      module.exports.alertBox(dataLanguage('passwordmismatch'))
	    else
	      hash($('#admin_password').val(), (passwd: string)=>{
	        systemConfig.admin_password = passwd
	        hash($('#currentpassword').val(), (currentpassword: string)=>{
	          systemConfig.currentpassword = currentpassword
	          send('change-adminpassword', systemConfig, 'configupdated', ()=>{
	            $('#boxAdminPassword').remove()
	            $('#lock').hide()
	            $('#menu').show()
	          })
	        })
	      })
	  })
	  $('#boxAdminPassword input').on("keydown", function(){
	    var key = event.key;
	    if(key === 'Enter') //enter
	      $('#submit').trigger("click")
	  })
	},*/

	listLanguages: ($place: JQuery, callback: ($place:JQuery)=>any)=>{
	  ipcRenderer.send('list-languages')
	  ipcRenderer.once('list-languages', function(event: IpcRendererEvent, languages: LanguageMenuItem[]){
	    if(typeof $place.attr('class') !== 'undefined' && $place.attr('class')?.split(' ')[0] === 'dropdown-menu')
        $place.html('')
	    languages.forEach( (item: LanguageMenuItem) => {
	      if(typeof $place.attr('class') !== 'undefined' && $place.attr('class')?.split(' ')[0] === 'dropdown-menu'){
	        var $li = $('<li/>').appendTo($place)
	        var $element = $('<a/>', {'href': '#', 'data-value': item.language}).text(item.name).appendTo($li)
          $element.on("click", function(){
	          if($('.mainPanel').text())
	            confirmBox(dataLanguage('askchangelanguage'), () => {
	              $('.mainPanel').remove()
	              ipcRenderer.send('change-language', $(this).data('value'))
	            })
	          else
	            ipcRenderer.send('change-language', $(this).data('value'))
	        })
	      }else
          $element = $('<option/>').text(item.name).val(item.language).appendTo($place)
	      if(typeof item.picture !== 'undefined')
          $element.append('<img src="' + item.picture + '" alt="">')
	    })
	    //sorting languages
      var itemSort: JQuery
	    if($place.attr('class') === 'dropdown-menu')
	      itemSort = $place.children('li')
	    else
	      itemSort = $place.children('option')
      itemSort.toArray().sort(function(a: HTMLElement, b: HTMLElement): number {
        if($(b).val()){
          var upA = $(a).text().toUpperCase();
          var upB = $(b).text().toUpperCase();
          return (upA < upB) ? -1 : (upA > upB) ? 1 : 0;
        }
        return 0
      }).forEach( (item: HTMLElement)=> {
        $(item).appendTo($place)
      })
	    if(typeof callback === "function")
	      callback($place)
	  })
	},
	setShortKeys: ()=>{
		$(document).off('keydown.dataButtons').on('keydown.dataButtons', (event)=>{
			Object.keys(module.exports.shortKeys).forEach( shortKey=>{
				var shortKeyItem = module.exports.shortKeys[shortKey]
				var split = shortKey.toUpperCase().split('+')
				if(split.indexOf('CTRL') !== -1 || split.indexOf('ALT') !== -1 || split.indexOf('SHIFT') !== -1 || shortKey[0] === 'F'){
					if( (split.indexOf('CTRL') === -1 && !event.ctrlKey) || (split.indexOf('CTRL') !== -1 && event.ctrlKey))
						if( (split.indexOf('ALT') === -1 && !event.altKey) || (split.indexOf('ALT') !== -1 && event.altKey))
							if( (split.indexOf('SHIFT') === -1 && !event.shiftKey) || (split.indexOf('SHIFT') !== -1 && event.shiftKey))
								split.forEach( key=>{
									if(key !== 'CTRL' && key !== 'ALT' && key !== 'SHIFT'){
										if(!event.shiftKey && key.length === 1)
											key = key.toLowerCase()
										if(event.key === key && $('div.panel.mainPanel').length === 0){
											if(shortKeyItem.dropdown) //@ts-ignore
							    			$('#'+shortKeyItem.id).children('a').trigger("click").parent().children('ul').children('li').off('keydown.dropdownMenu').on('keydown.dropdownMenu', navigationMenu)
							    		else
							    			$('#'+shortKeyItem.id).trigger("click")
										}
									}
								})
				}
			})
		})
	}
}

$(window).on("resize", () => {
  boxSize()
  var $title = $('#mainMenu #title')
  var left = ($body.width()||2)/2-($title.width()||2)/2
  $title.css('left', left+'px')
  var height = ($(window).height()||500)-100
  $('.mainPanel').attr('style', 'height:'+height+'px')
})

// creating shortcut keys
$(document).on("keydown", (event)=>{
  var key: string = event.key;
  if(key === 'Escape'){ //escape
    $('ul.dropdown-menu').trigger("mouseout") //close menu
    if($('#box').html()){ //close box
      $('#box .title input').trigger("click")
    }else if($('#boxProfile').html()) //close profile
      $('#closeBox').trigger("click")
    else if($('.mainPanel').html()){ //close mainPanel
      var $close = $('#close')
      var $cancel = $('#cancel')
      if($close.css('display') !== 'none')
        $close.trigger("click")
      if($cancel.css('display') !== 'none')
        $cancel.trigger("click")
    }
  }else if(key === 'Enter'){ //enter
  	if($('#box').length > 0){
    	$('#box button[title="ENTER"]').trigger("click") //close box and confirm
      event.preventDefault();
  	}
  }else if(event.ctrlKey && key === 'a' && !event.altKey){ // ctrl+a open about
    event.preventDefault();
    $('#about').trigger("click")
  }else if(event.ctrlKey && event.altKey && key === 'c'){ // @ts-ignore ctrl+alt+c configuration menu
    $('#systemConfig').children('a').trigger("click").parent().children('ul').children('li').off('keydown.dropdownMenu').on('keydown.dropdownMenu', navigationMenu)
  }else if(event.ctrlKey && event.altKey && key === 'l'){ // @ts-ignore ctrl+alt+l language menu
    $('#systemLanguage').children('a').trigger("click").parent().children('ul').children('li').off('keydown.dropdownMenu').on('keydown.dropdownMenu', navigationMenu)
  }else if(event.ctrlKey && key === 'u'){ // ctrl+u update
    var $update = $('#update')
    if($update.css('display') === 'block')
      $update.trigger("click")
  }else if(event.ctrlKey && event.altKey && key === 's') // ctrl+alt+s set small text
    $('#smallText').trigger("click")
  else if(event.ctrlKey && event.altKey && key === 'm') // ctrl+alt+m set medium text
    $('#mediumText').trigger("click")
  else if(event.ctrlKey && event.altKey && key === 'a') // ctrl+alt+a set large text
    $('#largeText').trigger("click")
  else if(event.ctrlKey && event.altKey && key === 'b') // ctrl+alt+b set blue theme
    $('#blueTheme').trigger("click")
  else if(event.ctrlKey && event.altKey && key === 'g') // ctrl+alt+g set gold theme
    $('#goldTheme').trigger("click")
  else if(event.ctrlKey && event.altKey && key === 'r') // ctrl+alt+r set green theme
    $('#greenTheme').trigger("click")
  else if(event.ctrlKey && event.altKey && key === 'k') // ctrl+alt+k backup data
    $('#backupData').trigger("click")
  //alert(key)
})

function navigationMenu(this: HTMLLIElement, event: KeyboardEvent){
  if(event.key === 'Enter' || event.key === 'ArrowRight'){
  	var opensubMenu = $(this).children('a').children('div.dropdown.dropdown-inline')
  	if($(this).children('a').children('span.submenuArrow').length > 0){
  		$(this).parent().off('click.prevent').on('click.prevent', function (event) {
		    event.stopPropagation()
		  })
  		if(opensubMenu.length === 0 || opensubMenu.css('display') === 'none'){
	  		event.preventDefault()
	  		$(this).children('a').trigger('mouseover').children('div.dropdown.dropdown-inline').off('keydown').on("keydown", function(event){
	  			if(event.key === 'ArrowLeft'){
	  				$(this).parent().focus()
	  				$(this).hide()
	  			}
	  			if(event.key === 'Enter'){
	  				$(document.activeElement||this).click()
	  				$(this).parent().parent().parent().parent().click()
	  				$(this).hide()
	  			}
					if(event.key === 'ArrowUp' || event.keyCode === 38 || event.key === 'ArrowDown' || event.keyCode === 40){
				  	var activeID:string = $(document.activeElement||this).attr('id')||''
				  	$(this).children('ul').children('li').each( (i:number, li:HTMLElement)=>{
				  		if($(li).children('a').attr('id') === activeID){
				  			if(i < $(this).children('ul').children('li').length && (event.key === 'ArrowDown' || event.keyCode === 40))
				  				$($(this).children('ul').children('li')[i+1]).children('a').focus()
				  			else if(i > 0 && (event.key === 'ArrowUp' || event.keyCode === 38))
				  				$($(this).children('ul').children('li')[i-1]).children('a').focus()
				  			return false
				  		}
				  	})
				  }
	  		})
	  		$(this).children('a').children('div.dropdown.dropdown-inline').children('ul').children('li').children('a').first().focus()
  		}
  	}else if(event.key === 'Enter'){
      $(this).children('a').trigger("click")
	  	$(this).parent().parent().parent().parent().click()
    }
  }
	if(event.key === 'ArrowUp' || event.keyCode === 38 || event.key === 'ArrowDown' || event.keyCode === 40){
  	var activeA:string = $(document.activeElement||this).attr('item')||''
  	$(this).parent().children('li').each( (i:number, li:HTMLElement)=>{
  		if($(li).children('a').attr('item') === activeA){
  			if(i < $(this).parent().children('li').length && (event.key === 'ArrowDown' || event.keyCode === 40))
  				$($(this).parent().children('li')[i+1]).children('a').focus()
  			else if(i > 0 && (event.key === 'ArrowUp' || event.keyCode === 38))
  				$($(this).parent().children('li')[i-1]).children('a').focus()
  			return false
  		}
  	})
  }
}

function boxSize(){
  $('.box').each(function(){
    var left = ( ($(window).width()||2)/2 )-( ($(this).width()||2)/2 )
    if(left < 0)
      left = 0
    var top = ( ($(window).height()||2)/2 )-( ($(this).height()||2)/2 )
    if(top < 0)
      top = 0
    $(this).attr('style', /*'height:'+($(this).height()+6)+'px;width:'+($(this).width()+6)+'px;*/'left:'+left+'px;top:'+top+'px;')
  })
}

/*function buf2Base64(buffer: ArrayBuffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

async function hash(inputString: string, callback: (buffer: string)=>any) {
    var inputBytes = new TextEncoder().encode(inputString);
    var hashBytes: ArrayBuffer = await window.crypto.subtle.digest("SHA-256", inputBytes);
    callback(buf2Base64(hashBytes))
}

function validatePassword(p: string) {
  if (p.length < 6)
    return 'password6caracter'
  if (p.search(/[a-z]/i) < 0)
    return 'password1letter'
  if (p.search(/[0-9]/) < 0)
    return 'password1number'
  return false
}*/
