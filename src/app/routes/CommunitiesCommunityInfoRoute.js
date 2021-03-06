import {
	get,
	getOwner,
	Route
} from "Ember";


export default Route.extend({
	model() {
		const model = this.modelFor( "communitiesCommunity" );

		return get( model, "owner" )
			.then( () => model );
	},

	refresh() {
		return getOwner( this ).lookup( "route:communitiesCommunity" ).refresh();
	}
});
