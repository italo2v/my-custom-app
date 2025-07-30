module.exports = {
	dateFormats: {'pt-BR': 'dd/mm/yy', 'en-US': 'mm/dd/yy'},
	masks: {
	  'pt-BR': {'mask': 'R$ {1.234,00}', 'abbreviation': 'BRL'},
	  'en-US': {'mask': '$ {1,234.00}', 'abbreviation': 'USD'},
	  'zh-CN': {'mask': '￥ {1,234.00}', 'abbreviation': 'CNY'},
	  'hi': {'mask': '₹ {1,234.00}', 'abbreviation': 'INR'},
	  'de': {'mask': '€ {1,234.00}', 'abbreviation': 'EUR'},
	  'fr-ca': {'mask': '$ {1,234.00}', 'abbreviation': 'CAD'},
	  'en-gb': {'mask': '£ {1,234.00}', 'abbreviation': 'GBP'}
	}
}