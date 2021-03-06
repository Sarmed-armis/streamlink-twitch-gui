import { get } from "Ember";
import UserIndexRoute from "routes/UserIndexRoute";
import InfiniteScrollMixin from "mixins/InfiniteScrollMixin";
import RefreshRouteMixin from "mixins/RefreshRouteMixin";
import { toArray } from "utils/ember/recordArrayMethods";
import preload from "utils/preload";


export default UserIndexRoute.extend( InfiniteScrollMixin, RefreshRouteMixin, {
	itemSelector: ".stream-item-component",

	modelName: "twitchStreamHosted",

	model() {
		return get( this, "store" ).query( this.modelName, {
			offset: get( this, "offset" ),
			limit: get( this, "limit" )
		})
			.then( toArray() )
			.then( records => {
				// The target (stream) reference is loaded asynchronously
				// just get the PromiseProxy object and wait for it to resolve
				const promises = records
					.mapBy( "target" )
					.uniqBy( "id" )
					.map( streamPromise => {
						const stream = streamPromise.content;
						const promise = get( stream, "isLoading" )
							? streamPromise
							: stream.reload();

						return promise
							.then( preload( "preview.mediumLatest" ) );
					});

				// wait for everything to resolve and return the hosts list
				return Promise.all( promises )
					.then( () => records );
			});
	}
});
