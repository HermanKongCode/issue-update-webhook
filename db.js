var mongoose = require( 'mongoose');
var Schema   = mongoose.Schema;

var Issue = new Schema({
	login : String,
	repository: String,
	title : String,
	description : String
})

mongoose.model( 'Issue', Issue );
mongoose.connect('mongodb://localhost/repository');
