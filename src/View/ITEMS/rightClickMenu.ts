interface RightClickMenu {
  menuItems: ClickMenuItem[];
  showMenu: (id:string, datavalue:string)=>void;
  close: (id:string)=>void;
}
interface ClickMenuItem {
  id: string;
  function?: (arg?:string, arg2?:string)=>void;
  text: string;
  subMenu?: boolean;
  items?: ClickMenuItem[];
}

var mouseX:number = 0
var mouseY:number = 0

module.exports = {
  menuItems: [],
  showMenu: (id:string, datavalue:string)=>{
    var $menu = $('#rightClickMenu_'+id)
    $menu.remove()
    $menu = $('<div/>', {'id': 'rightClickMenu_'+id, 'data-value': datavalue, 'class': 'rightClickMenu dropdown dropdown-inline', 'style': 'left:'+mouseX+'px;top:'+mouseY+'px;'}).appendTo($body)
    var $ul = $('<ul/>', {'class': 'dropdown-menu', 'role': 'menu'}).appendTo($menu)
    $(module.exports.menuItems).each(function(i:number, item: ClickMenuItem){
      var $li = $('<li/>').appendTo($ul)
      var $a = $('<a/>', {'href': '#', 'id': item.id}).html(item.text).appendTo($li)
      if(item.subMenu){
        $('<span/>', {'class': 'submenuArrow', 'style': 'left:'+(($li.width()||0)-15)+'px'}).appendTo($a)
        $a.on("mouseover", function(){
          var $subMenu = $('.rightClickSubMenu')
          if($subMenu.attr('id') !== 'rightClickSubMenu-'+i)
            $subMenu.remove()
          $subMenu = $('<span/>', {id: 'rightClickSubMenu-'+i, 'class': 'rightClickSubMenu dropdown dropdown-inline', 'style': 'position:absolute;left:'+($ul.width()||50)+'px;top:'+(i*26)+'px'}).appendTo($ul)
          $('<ul/>', {'class': 'dropdown-menu', 'role': 'menu'}).appendTo($subMenu)
          if(typeof item.items === 'object')
            item.items.forEach( (item: ClickMenuItem)=>{
              $li = $('<li/>').appendTo($subMenu.children('ul'))
              $('<a/>', {'href': '#', 'id': item.id}).html(item.text).appendTo($li)
            })
        })
      }else
        $a.on("mouseover", function(){
          $('.rightClickSubMenu').remove()
        })
    })
    setMenuFunctions($menu)
  },
  close: (id:string)=>{
    $('#rightClickMenu_'+id).remove()
  }
}

$body.on("mousemove", function(e) {
  mouseX = e.clientX
  mouseY = e.clientY
})

function setMenuFunctions($menu: JQuery){
  $menu.on("mousedown", function(e: JQuery.MouseDownEvent){
    var menuItems: ClickMenuItem[] = module.exports.menuItems
    var menuClick: boolean = false
    if($menu.length > 0){
      menuItems.forEach( (item: ClickMenuItem)=>{
        if(e.target.id === item.id && !menuClick){
          menuClick = true
          if(typeof item.function === 'function')
            item.function()
        }
        if(typeof item.items === 'object')
          item.items.forEach( (subItem: ClickMenuItem)=>{
            if(e.target.id === subItem.id && !menuClick)
              if(typeof subItem.function === 'function')
                subItem.function()
          })
      })
      $menu.remove()
    }
  })
}