const { calc }: Calc = require('../../Common/calc.js')
const { dateFormats, masks }: maskConfig = require('../../DataConfig/fieldMasks.js')

interface maskConfig {
  dateFormats: {[lang:string]: string}
  masks: FieldMasks
}
interface SheetField {
  dateNumber: number;
  getMasks: ()=>FieldMasks;
  createField: (type:FieldType, arg2?:SelectItem[]|string, value?:string|number, comment?:string,id?:string,expand?:"expand")=>JQuery;
  updateType: (field: JQuery, type:FieldType)=>JQuery;
  updateVal: (field: JQuery, value:string|number)=>void;
  getVal: (field: JQuery)=>string;
}
interface SelectItem {
  name: string;
  value?: string;
  disabled?: boolean;
}
type FieldType = "money" | "float" | "integer" | "alphanumeric" | "letters" | "date" | "text" | "select"
interface CurrencyItem {
  number: number;
  masked: string;
}
interface FieldMasks {
  [mask: string]: Mask;
}
interface Mask {
  mask: string;
  abbreviation: string;
}

module.exports = {
  dateNumber: 0,
  getMasks: ()=>{
    return masks
  },
  createField: (type:FieldType, arg2:SelectItem[]|string, value:string|number, comment?:string,id?:string,expand?:string)=>{
    var $field = $('<div/>', {'class': 'sheetField'})
    var $field_value = $('<div/>', {'class': 'value'}).appendTo($field)
    if(id !== undefined && id !== '')
      $field.attr('id', id)
    if(expand !== undefined && expand === 'expand')
      $field.attr('expand', 'true')
    if(typeof value === 'number')
      value = value.toString()
    else if(typeof value === 'undefined')
      value = ''
    if(typeof arg2 === 'undefined')
      arg2 = ''
    if(type === 'date'){
      var dateISOID:string = 'dateISO-'+module.exports.dateNumber
      var this_date:string = ''
      var $inputDate: JQuery = module.exports.updateType($field, type)
      if(typeof arg2 === 'string') //language
        $field.attr('data-language', arg2)
      if(value !== '')
        if(value.split('-').length === 3){
          var this_year:string = value.split('-')[0]
          var this_month:string = value.split('-')[1]
          var this_day:string = value.split('-')[2]
          this_date = dateFormats[dataLanguage('langLocale')].replace('dd', this_day).replace('mm', this_month).replace('yy', this_year)
        }
      var my_datepicker: JQueryUI.DatepickerOptions = {
        dateFormat: dateFormats[dataLanguage('langLocale')],
        altFormat: 'yy-mm-dd',
        dayNames: [dataLanguage('sunday'), dataLanguage('monday'), dataLanguage('tuesday'), dataLanguage('wednesday'), dataLanguage('thursday'), dataLanguage('friday'), dataLanguage('saturday')],
        dayNamesMin: [dataLanguage('su'), dataLanguage('mo'), dataLanguage('tu'), dataLanguage('we'), dataLanguage('th'), dataLanguage('fr'), dataLanguage('sa')],
        monthNames: [dataLanguage('january'), dataLanguage('february'), dataLanguage('march'), dataLanguage('april'), dataLanguage('may'), dataLanguage('june'), dataLanguage('july'), dataLanguage('august'), dataLanguage('september'), dataLanguage('october'), dataLanguage('november'), dataLanguage('december')],
        monthNamesShort: [dataLanguage('jan'), dataLanguage('feb'), dataLanguage('mar'), dataLanguage('apr'), dataLanguage('may'), dataLanguage('jun'), dataLanguage('jul'), dataLanguage('aug'), dataLanguage('sep'), dataLanguage('oct'), dataLanguage('nov'), dataLanguage('dec')],
        altField: '#'+dateISOID
      }
      $('<input/>', {'type': 'hidden', 'id': dateISOID, 'value': value}).appendTo($field)
      $inputDate.val(this_date).trigger("change.sheetField").datepicker(my_datepicker)
      module.exports.dateNumber++
    }else if(type === 'select'){
      var values: SelectItem[] = []
      if(typeof arg2 === 'string')
        values.push({name:arg2, value:arg2})
      else if(typeof arg2 === 'object')
        values = arg2
      $field_value.hide().html(value)
      $field.addClass('select')
      var $select = $('<select/>').appendTo($field).off("change.sheetField").on("change.sheetField", function(){
        if($(this).parent().attr('readonly') !== 'readonly' && $(this).parent().attr('disabled') !== 'disabled')
          $(this).parent().children('div.value').html($(this).val()?.toString()||'')
      })
      values.forEach( (item: SelectItem)=>{
        var $op = $('<option/>').html(item.name).appendTo($select)
        if(item.disabled)
          $op.attr('disabled', 'DISABLED')
        else{
          if(typeof item.value === 'string')
            $op.val(item.value)
          if(value === item.value)
            $op.attr('selected', 'SELECTED')
        }
      })
    }else{
      var textbox: JQuery = module.exports.updateType($field, type)
      var language:string = arg2.toString()
      if(comment !== undefined && comment !== '')
        $field.attr('data-comment', comment)
      if(language !== null && language !== '')
        $field.attr('data-language', language)
      textbox.val(value).trigger("change.sheetField").trigger("focusout")
    }
    return $field
  },
  updateType: ($field: JQuery, type: FieldType):JQuery=>{
    $field.removeClass('moneyMask').removeClass('lettersAndNumbers').removeClass('Integer').removeClass('Float').removeClass('text').removeClass('date')
    $field.children('textarea').remove()
    $field.children('input').remove()

    var floatChars: (element: HTMLElement, language:string)=>void = function(element: HTMLElement, language:string){
      if(language !== ''){
        var decimal_mask:string = getDecimalMaskChar(language)
        var value:string = $(element).val()?.toString()||''
        var allowedChars:string, new_value:string, c:number
        if(value[0] === '='){
          allowedChars = '=0123456789()+-/*^'+decimal_mask
          for(c=0;c<=value.length-1;c++){
            if(allowedChars.indexOf(value[c]) === -1)
              value = value.split(value[c]).join('')
          }
          new_value = value
        }else{
          allowedChars = '0123456789-'+decimal_mask
          for(c=0;c<=value.length-1;c++){
            if(allowedChars.indexOf(value[c]) === -1)
              value = value.split(value[c]).join('')
            if(value[c] === '-' && allowedChars.indexOf(value[c]) !== 0)
              value = '-'+value.split('-').join('')
          }
          var str:string[] = value.split(decimal_mask)
          new_value = ''
          for(var s:number=0;s<=str.length-1;s++){
            if(s === str.length-1 && s !== 0)
              new_value += decimal_mask
            new_value += str[s]
          }
        }
        $(element).val(new_value)
      }
    }
    var $textbox: JQuery
    if($field.attr('expand') === 'true')
      $textbox = $('<textarea>', {class: 'sheetFieldFocused'}).appendTo($field).hide()
    else
      $textbox = $('<input/>').appendTo($field).hide()
    $textbox.attr('maxlength', 200)
    if(type === 'money'){
      $field.addClass('moneyMask')
      $textbox.on('input', function(this: HTMLInputElement) {
          $(this).val( $(this).val()?.replace(/[^0-9,.=+-/*()^]/g,'')||'' )
      }).on('input', function(){
        floatChars(this, $(this).parent()?.attr('data-language')||'')
      })
    }else if(type === 'float'){
      $field.addClass('Float')
      $textbox.on('input', function(this: HTMLInputElement) {
        $(this).val( $(this).val()?.replace(/[^0-9,.=+-/*()^]/g,'')||'' )
      }).on('input', function(){
        floatChars(this, dataLanguage('langLocale'))
      })
    }else if(type === 'integer'){
      $field.addClass('Integer')
      $textbox.on('input', function(this: HTMLInputElement) {
          $(this).val( $(this).val()?.replace(/\D/g, "")||'' )
      })
    }else if(type === 'alphanumeric'){
      $field.addClass('lettersAndNumbers')
      $textbox.on('input', function(this: HTMLInputElement) {
          $(this).val( $(this).val()?.replace(/[^a-z0-9áàâãéèêíïóôõöúçñ -]+$/i,'')||'' )
      })
    }else if(type === 'letters'){
      $field.addClass('letters')
      $textbox.on('input', function(this: HTMLInputElement) {
          $(this).val( $(this).val()?.replace(/[^a-záàâãéèêíïóôõöúçñ -]+$/i,'')||'' )
      })
    }else if(type === 'date'){
      $field.addClass('date')
      $textbox.on('input', function(this: HTMLInputElement) {
          $(this).val( $(this).val()?.replace(/[^0-9/]+$/i,'')||'' )
      }).attr('maxlength', 10)
    }else if(type === 'text')
      $field.addClass('text')
    setEvents($field)
    return $textbox
  },
  updateVal: ($field: JQuery, value: string|number)=>{
    var $textbox: JQuery = $field.children('input.hasDatepicker')
    if($textbox.length > 0 && typeof value === 'string'){
      $field.children('input[type="hidden"]').val(value)
      if(value.split('-').length === 3){
        var this_year:string = value.split('-')[0]
        var this_month:string = value.split('-')[1]
        var this_day:string = value.split('-')[2]
        var this_date = dateFormats[dataLanguage('langLocale')].replace('dd', this_day).replace('mm', this_month).replace('yy', this_year)
        $field.children('input.hasDatepicker').val(this_date).trigger('change')
      }
      //$textbox.datepicker("setDate", new Date(value).toLocaleDateString(dateFormats[dataLanguage('landLocale')]))
    }else {
      $textbox = $field.children('input')
      if ($textbox.length === 0)
        $textbox = $field.children('textarea')
      if ($textbox.length === 0)
        $textbox = $field.children('select')
      $textbox.val(value).trigger("change").trigger("focusout")
    }
  },
  getVal: ($field:JQuery):string=>{
    var field_value:string = ''
    if($field.length > 0){
      if($field.hasClass('date')) {
        field_value = $field.children('input[type="hidden"]').val()?.toString() || ''
      }else
        field_value = $field.attr('data-value') || $field.attr('data-number') || $field.children('div.value').html() || ''
    }
    else
      field_value = ''
    return field_value
  }
}

function setEvents($field: JQuery){
  var $textbox: JQuery = $field.children('input')
  if($textbox.length === 0)
    $textbox = $field.children('textarea')

  $($field).on("click", function(e: JQuery.ClickEvent){
    if(e.target.tagName === 'DIV' && ($(e.target).hasClass('value') || $(e.target).hasClass('sheetField'))
    && $(this).attr('readonly') !== 'readonly' && $(this).attr('disabled') !== 'disabled'){
      var language:string = $(this).attr('data-language')||''
      var editvalue:string = $(this).attr('data-value') || $(this).children('div.value').html()
      if($(this).hasClass('Float'))
        language = dataLanguage('langLocale')
      if(language !== undefined)
        editvalue = getTypedNumber(editvalue, language)
      $(this).children('div.value').hide()
      if($(this).children('input').length > 0)
        $(this).children('input').show().val(editvalue).trigger("focus")
      if($(this).children('textarea').length > 0)
        $(this).children('textarea').show().val(editvalue).trigger("focus")
    }
  })
  $textbox.on("focusout", function(){
    $(this).hide()
    $(this).parent().children('div.value').show()
  }).off("change.sheetField").on("change.sheetField", function(){
    var datavalue: string = $(this).val()?.toString()||''
    var value: string = ''
    var language:string = $(this).parent()?.attr('data-language')||''
    if(language !== '' && $(this).parent().hasClass('moneyMask') )
      datavalue = getOriginalNumber(datavalue, language)
    else if($(this).parent().hasClass('Float')){
      language = dataLanguage('langLocale')
      datavalue = getOriginalNumber(datavalue, language)
    }
    $(this).parent().removeAttr('data-mask')
    if(datavalue !== '' && datavalue[0] === '='){
      $(this).parent().attr('data-value', datavalue)
      value = calc(datavalue).toString()
      if(!Number.isFinite(parseFloat(value))){
        $(this).val('#!calcerror')
        $(this).parent().attr('data-mask', '#!calcerror')
        $(this).parent().children('div.value').html('#!calcerror')
        return
      }
      value = parseFloat(value).toFixed(2)
      $(this).parent().attr('data-mask', value)
      $(this).parent().children('div.value').html(value)
    }
    if(datavalue !== ''){
      if($(this).parent().hasClass('moneyMask')){
        if(value === '')
          value = datavalue
        var obj:CurrencyItem = setCurrencyMask(value, language)
        $(this).parent().attr({'data-value': datavalue, 'data-mask': obj.masked, 'data-number': obj.number})
        $(this).parent().children('div.value').html(obj.masked)
      }else{
        $(this).parent().attr('data-value', datavalue)
        var typed = $(this).parent().attr('data-mask') || $(this).val()?.toString()||''
        $(this).parent().children('div.value').html(getTypedNumber(typed, language))
      }
    }else{
      $(this).parent().removeAttr('data-value').removeAttr('data-mask').removeAttr('data-number')
      $(this).parent().children('div.value').html('')
    }
    updateFontColor($(this).parent())
  })
  updateFontColor($field)
}

function setCurrencyMask(number:string, this_language:string):CurrencyItem{
  var mask:string = masks[this_language].mask
  var str:string[] = mask.split('{')
  var str2:string[] = str[1].split('}')
  var number_mask:string = str2[0]
  var thousand_mask:string = number_mask[1]
  var decimal_mask:string = number_mask[5]
  number = number.split('.').join(decimal_mask)

  var decimal_number:string = number.split(decimal_mask)[1] || '00'
  var decimal_masked:string = decimal_number
  if(decimal_number.length === 1)
    decimal_masked += '0'
  else if(decimal_number.length > 2)
    decimal_masked = decimal_masked[0]+decimal_masked[1]

  var int_number:string = number.split(decimal_mask)[0].replace(/[^0-9-]/g,'')
  var number_masked:string = ''
  var n:number=0
  for(var c:number=int_number.length-1;c>=0;c--){
    n++
    number_masked = int_number[c]+number_masked
    if(n % 3 === 0 && n !== int_number.length && int_number[c-1] !== '-')
      number_masked = thousand_mask+number_masked
  }
  number_masked += decimal_mask+decimal_masked

  var this_number:number
  if(decimal_number === '00')
    this_number = parseInt(int_number)
  else
    this_number = parseFloat(int_number+'.'+decimal_number)
  return {'masked': str[0]+number_masked+str2[1], 'number': this_number}
}

function getTypedNumber(number:string, this_language:string):string{
  var decimal_mask:string = getDecimalMaskChar(this_language)
  number = number.split('.').join(decimal_mask)
  return number
}

function getOriginalNumber(number:string, this_language:string):string{
  var decimal_mask:string = getDecimalMaskChar(this_language)
  number = number.split(decimal_mask).join('.')
  return number
}

function getDecimalMaskChar(language:string):string{
  var mask:string = masks[language].mask
  var str:string[] = mask.split('{')
  var str2:string[] = str[1].split('}')
  var number_mask:string = str2[0]
  if(number_mask[5] !== undefined && number_mask[5] !== '')
    return number_mask[5]
  else
    return '.'
}

function updateFontColor($field: JQuery){
	var value:string = $field.attr('data-number') || $field.attr('data-value') || $field.children('input').val()?.toString() || ''
  if(value !== ''){
    if(value[0] === '=')
      value = calc(value).toString()
    if(value[0] === '-' && Number.isFinite(parseFloat(value))){
      $field.children('div.value').css('color', 'red')
    }else
      $field.children('div.value').css('color', '')
  }
}
