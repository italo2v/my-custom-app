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
	    var result:number = solveExpression(last[0])
	    value = value.replace('('+last[0]+')', result.toString())
	  }
	  value = solveExpression(value).toString()
	  return value
	}
}

function solveExpression(exp:string):number{
  var operations: string[] = ['^', '*', '/', '+', '-']
  var operands: string[] = ['']
  var operators: string[] = []
  var o:number
  for(var char:number=0;char<exp.length;char++){
    var op:boolean = false
    for(o=0;o<operations.length-1;o++){
      if(exp[char] === operations[o]){
        operators.push(operations[o])
        op = true
      }
    }
    if(exp[char] === '-' && exp[char-1] !== undefined && Number.isFinite(parseFloat(exp[char-1]))){
      operators.push(exp[char])
      op = true
    }
    if(op){
      operands.push('')
    }
    else
      operands[operands.length-1] += exp[char]
  }
  var result:number
  while(operators.indexOf('*') !== -1 || operators.indexOf('/') !== -1 || operators.indexOf('^') !== -1){
    for(o=0;o<operators.length;o++){
      if(operators[o] === '*')
        result = parseFloat(operands[o])*parseFloat(operands[o+1])
      else if(operators[o] === '/')
        result = parseFloat(operands[o])/parseFloat(operands[o+1])
      else if(operators[o] === '^'){
        result = parseFloat(operands[o])
        for(var e:number=1;e<=parseInt(operands[o+1])-1;e++)
          result *= parseFloat(operands[o])
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