interface Calc {
  calc: (value:string)=>string;
}
module.exports = {
	calc: (value:string):string=>{
	  if(value[0] !== '=')
	    return value

	  value = value.split('=').join('')
	  while(value.split('(').length > 1){
	    if(value.split(')').length < 2)
	      return '#!calcerror'
	    var par: string[] = value.split('(')
	    if(par[0] !== ''){
	      var last_char:string = par[0][par[0].length-1]
	      if(last_char !== '*' && last_char !== '/' && last_char !== '+' && last_char !== '-')
	        return '#!calcerror'
	    }
	    var last: string[] = par[par.length-1].split(')')
      if(last.length <=1)
        return '#!calcerror'
	    if(last[1] !== ''){
	      var first_char:string = last[1][0]
	      if(first_char !== '*' && first_char !== '/' && first_char !== '+' && first_char !== '-')
	        return '#!calcerror'
	    }
	    var result:number|string = solveExpression(last[0])
      if(result === '#!calcerror')
        return result
	    value = value.replace('('+last[0]+')', result.toString())
	  }
	  value = solveExpression(value).toString()
	  return value
	}
}

function solveExpression(exp:string):number|string{
  var operations: string[] = ['^', '*', '/', '+', '-']
  var operands: string[] = ['']
  var operators: string[] = []
  var o:number
  for(var char:number=0;char<exp.length;char++){
    var op:boolean = false
    for(o=0;o<operations.length;o++){
      if(exp[char] === operations[o] && exp[char] !== '-' && exp[char] !== '+'){
        operators.push(operations[o])
        op = true
      }
    }
    if( (exp[char] === '-' || exp[char] === '+') && exp[char-1] !== undefined && Number.isFinite(parseFloat(exp[char-1]))){
      operators.push(exp[char])
      op = true
    }
    if(op){
      operands.push('')
    }
    else
      operands[operands.length-1] += exp[char]
  }
  for(var operand=0;operand<operands.length;operand++)
    if(!Number.isFinite(parseFloat(operands[operand])))
      return '#!calcerror'
  var result:number
  while(operators.indexOf('*') !== -1 || operators.indexOf('/') !== -1 || operators.indexOf('^') !== -1){
    for(o=0;o<operators.length;o++){
      if(operators[o] === '*')
        result = parseFloat(operands[o])*parseFloat(operands[o+1])
      else if(operators[o] === '/')
        result = parseFloat(operands[o])/parseFloat(operands[o+1])
      else if(operators[o] === '^'){
        result = parseFloat(operands[o])
        var invert_denominator:boolean
        var exponent:number = parseInt(operands[o+1])
        if(exponent < 0){
          invert_denominator = true
          exponent = -1*exponent
        }else
          invert_denominator = false
        for(var e:number=1;e<=exponent-1;e++)
          result *= parseFloat(operands[o])
        if(invert_denominator)
          result = 1/result
      }
      else
        continue
      operands[o+1] = result.toString()
      operators.splice(o, 1)
      operands.splice(o, 1)
      break
    }
  }

  while(operators.indexOf('+') !== -1 || operators.indexOf('-') !== -1){
    for(o=0;o<operators.length;o++){
      if(operators[o] === '+')
        result = parseFloat(operands[o])+parseFloat(operands[o+1])
      else if(operators[o] === '-')
        result = parseFloat(operands[o])-parseFloat(operands[o+1])
      else
        continue
      operands[o+1] = result.toString()
      operators.splice(o, 1)
      operands.splice(o, 1)
      break
    }
  }
  return parseFloat(operands[0])
}
