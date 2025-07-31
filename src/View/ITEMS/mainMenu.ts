interface MainMenu {
	menuItems: MenuItem[];
	create: ()=>void;
	defaultMenu: ()=>void;
	hideItems: ()=>void;
}

type MenuType = "button" | "menu"
type Pos = "left" | "right"
interface DropdownItem {
	id: string;
	text: string;
	menuTitle?: string;
	title?: string;
	function: ()=>void;
}
interface DropdownSubMenu {
	submenu: boolean;
	text: string;
	items: Array<DropdownItem>;
	title?: string;
}
interface MenuItem {
	id?: string;
	type: MenuType;
	text: string;
	pos: Pos;
	title?: string;
	collection?: string;
	panel?:string;
	function?: Function;
	items?: Array<DropdownSubMenu | DropdownItem>;
	data?:boolean;
	menuTitle?: string;
}

module.exports = {
	menuItems: [],
	create: ()=>{
		$('#mainMenu').remove()
	  $('<div/>', {'id': 'mainMenu', 'class': 'panel'}).appendTo($body)
	  $('<button/>', {'id': 'title', 'class': 'btn btn-warning', 'style': 'top: 21px'}).appendTo('#mainMenu').attr('disabled', 'disabled')

	  var ids: string[] = []
	  var subMenu = 0
	  $(module.exports.menuItems).each(function(i: number, item: MenuItem){
	    if(item.type === 'button')
	      insertButtonMenu(item)
	    else if(item.type === 'menu')
	      insertDropdownMenu(item, subMenu, ids)
	  })
	  module.exports.defaultMenu()
	},

	defaultMenu: ()=>{
		module.exports.hideItems()
		$('#mainMenu button, #mainMenu div').each( function(){
			if($(this).attr('data') === 'true')
				$(this).show()
			if($(this).hasClass('btn-warning'))
				$(this).hide()
		})
	},

	hideItems: ()=>{
		$('#mainMenu button, #mainMenu div').each( function(){
			if($(this).attr('data') === 'true')
				$(this).hide()
		})
	  $('#update').hide()
	  $('#close').hide()
	  $('#cancel').hide()
	}
}

function insertButtonMenu(item: MenuItem){
  var $button = $('<button/>', {'type': 'button', 'class': 'btn btn-primary'}).html(dataLanguage(item.text)).appendTo('#mainMenu')
  if(typeof item.id === 'string')
  	$button.attr('id', item.id)
  if(item.data === true)
  	$button.attr('data', 'true')
  if(typeof item.title === 'string')
  	$button.attr('title', item.title)
  if(typeof item.menuTitle === 'string')
		$button.attr("data-title", dataLanguage(item.menuTitle)).on("click", updateTitle)
  if(typeof item.function === 'function')
		$button.on("click", item.function)
  if(item.pos !== undefined)
    $button.addClass('pull-'+item.pos)
}

function insertDropdownMenu(item: MenuItem, subMenu: number, ids: string[]){
  var $div = $('<div/>', {'class': 'dropdown dropdown-inline'}).appendTo('#mainMenu').on('shown.bs.dropdown', function () {
	  $div.children('ul').children('li').children('a').children('span.submenuArrow').each( (index:number, arrow: HTMLElement)=>{
		 $(arrow).css('left', (($(arrow).parent().parent().width()||0)-15)+'px')
		 $(arrow).parent().children('div.dropdown.dropdown-inline').hide()
	  })
	})
  if(typeof item.id === 'string')
  	$div.attr('id', item.id)
  if(typeof item.title === 'string')
  	$div.attr('title', item.title)
  if(item.data === true)
  	$div.attr('data', 'true')
  if(item.pos !== undefined)
		$div.addClass('pull-'+item.pos)
  var $a = $('<a/>', {'href': '#', 'class': 'btn btn-primary', 'data-toggle': 'dropdown'}).appendTo($div)
  $('<span/>').html(dataLanguage(item.text)).appendTo($a)
  $('<span/>', {'class': 'caret'}).appendTo($a)
  var $ul = $('<ul/>', {'class': 'dropdown-menu', 'role': 'menu'}).appendTo($div)
  if(item.items)
	  $(item.items).each(function(menuIndex: number, menuItem: any){
	    var $li = $('<li/>').appendTo($ul)
	    if(menuItem.submenu !== undefined && menuItem.submenu){
	    	subMenu++
	      $a = $('<a/>', {'href': '#', item: menuIndex}).html(dataLanguage(menuItem.text)).appendTo($li)
	      $('<span/>', {'class': 'submenuArrow', 'data-id': 'SubMenu-'+item.text+'-'+subMenu}).appendTo($a)
	      var $submenu = $('<div/>', {id: 'SubMenu-'+item.text+'-'+subMenu, class: 'dropdown dropdown-inline', style: 'left:'+$($a).parent().parent().width()+'px;top:'+(menuIndex*(($a.height()||0)+6))+'px;position:absolute;display:block;'}).appendTo($a)
        var $submenu_ul = $('<ul/>', {class: 'dropdown-menu', role: 'menu', style: 'display:block;'}).appendTo($submenu)
        for(var m:number=0;m<=menuItem.items.length-1;m++){
          var $submenu_li = $('<li/>').appendTo($submenu_ul)
          var $subitem = $('<a/>', {'href': '#'}).html(dataLanguage(menuItem.items[m].text)).appendTo($submenu_li)
		      if(typeof menuItem.items[m].id === 'string')
						$subitem.attr("id", menuItem.items[m].id)
		      if(typeof menuItem.items[m].title === 'string')
						$subitem.attr("title", menuItem.items[m].title)
          if(typeof menuItem.items[m].menuTitle === 'string' && menuItem.items[m].menuTitle !== '')
						$subitem.attr('data-title', dataLanguage(menuItem.items[m].menuTitle)).on("click", updateTitle)
          if(typeof menuItem.items[m].function === 'function')
						$subitem.on("click", menuItem.items[m].function)
        }
				$a.on("mouseover", function(){
	        //closeSubMenus(ids)
	        $(this).parent().parent().children('li').children('a').children('div.dropdown.dropdown-inline').hide()
	        var id:string = $(this).children('span').data('id')
					var $div = $('#'+id)
					$div.css({'left': ($div.parent().parent().width()||0)+'px', 'top': (menuIndex*( ($(this).height()||20) +6))+'px'}).show()
	      })
	    }else{
				$a = $('<a/>', {'href': '#', item: menuIndex}).html(dataLanguage(menuItem.text)).appendTo($li)
	      if(typeof menuItem.id === 'string')
					$a.attr("id", menuItem.id)
	      if(typeof menuItem.title === 'string')
					$a.attr("title", menuItem.title)
	      if(typeof menuItem.menuTitle === 'string' && menuItem.menuTitle !== '')
					$a.attr('data-title', dataLanguage(menuItem.menuTitle)).on("click", updateTitle)
	      if(typeof menuItem.function === 'function')
					$a.on("click", menuItem.function)
	  	}
	  })
}

function updateTitle(this: HTMLElement){
	var $menuTitle = $('#mainMenu #title')
	var $pageTitle = $('#pageTitle')
	var title: string = ''
	$menuTitle.html( ($(this).attr('data-title')||'') ).show()
	$menuTitle.css('left', ( ($body.width()||2)/2-($menuTitle.width()||2)/2)||0 +'px')
	if($pageTitle.html().split('-').length > 1)
		title = $pageTitle.html().split('-')[1].split(' ').join('')
	else
		title = $pageTitle.html()
	$pageTitle.html($(this).attr('data-title')+' - '+title)
}
