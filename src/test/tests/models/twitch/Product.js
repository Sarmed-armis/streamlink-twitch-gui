import {
	module,
	test
} from "QUnit";
import {
	buildOwner,
	runDestroy
} from "Testutils";
import {
	setupStore,
	adapterRequest
} from "Store";
import {
	get,
	Service
} from "Ember";
import {
	Model,
	RESTSerializer
} from "EmberData";
import Product from "models/twitch/Product";
import ProductSerializer from "models/twitch/ProductSerializer";
import ProductEmoticon from "models/twitch/ProductEmoticon";
import ProductEmoticonSerializer from "models/twitch/ProductEmoticonSerializer";
import User from "models/twitch/User";
import UserAdapter from "models/twitch/UserAdapter";
import UserSerializer from "models/twitch/UserSerializer";
import Channel from "models/twitch/Channel";
import ChannelSerializer from "models/twitch/ChannelSerializer";
import TwitchAdapter from "store/TwitchAdapter";
import TwitchProductFixtures from "fixtures/models/twitch/Product.json";
import TwitchUserFixtures from "fixtures/models/twitch/User.json";
import TwitchChannelFixtures from "fixtures/models/twitch/Channel.json";


let owner, env;


module( "models/twitch/Product", {
	beforeEach() {
		owner = buildOwner();

		owner.register( "service:auth", Service.extend() );
		owner.register( "model:twitch-product", Product );
		owner.register( "serializer:twitch-product", ProductSerializer.extend({
			modelNameFromPayloadKey() {
				return "twitchProduct";
			}
		}) );
		owner.register( "model:twitch-product-emoticon", ProductEmoticon );
		owner.register( "serializer:twitch-product-emoticon", ProductEmoticonSerializer );
		owner.register( "model:twitch-user", User );
		owner.register( "adapter:twitch-user", UserAdapter );
		owner.register( "serializer:twitch-user", UserSerializer );
		owner.register( "model:twitch-channel", Channel );
		owner.register( "adapter:twitch-channel", TwitchAdapter.extend() );
		owner.register( "serializer:twitch-channel", ChannelSerializer );
		owner.register( "model:twitch-stream", Model.extend() );
		owner.register( "serializer:twitch-stream", RESTSerializer.extend() );

		env = setupStore( owner );
	},

	afterEach() {
		runDestroy( owner );
		owner = env = null;
	}
});


test( "Serializer and partner_login relation", assert => {

	// TwitchProduct is just an embedded model

	env.adapter.findRecord = () =>
		Promise.resolve({
			twitchProduct: TwitchProductFixtures[ "embedded" ]
		});

	env.store.adapterFor( "twitch-user" ).ajax = ( url, method, query ) =>
		adapterRequest( assert, TwitchUserFixtures[ "by-id" ], url, method, query );

	env.store.adapterFor( "twitch-channel" ).ajax = ( url, method, query ) =>
		adapterRequest( assert, TwitchChannelFixtures[ "by-id" ], url, method, query );

	return env.store.findRecord( "twitchProduct", 1 )
		.then( record => {
			assert.deepEqual(
				record.toJSON({ includeId: true }),
				{
					id: "1",
					short_name: "foo",
					ticket_type: "chansub",
					owner_name: "foo",
					features: {
						bitrate_access: []
					},
					interval_number: 1,
					recurring: true,
					partner_login: "foo",
					price: "$4.99",
					period: "Month",
					emoticons: [
						"bar",
						"baz"
					]
				},
				"Has the correct model attributes"
			);

			assert.ok(
				env.store.hasRecordForId( "twitchProduct", 1 ),
				"Has the new Product record registered in the data store"
			);

			assert.ok(
				   env.store.hasRecordForId( "twitchProductEmoticon", "bar" )
				&& env.store.hasRecordForId( "twitchProductEmoticon", "baz" ),
				"Has all ProductEmoticon records registered in the data store"
			);

			assert.strictEqual(
				env.store.peekAll( "twitchUser" ).get( "length" ),
				0,
				"Does not have any User records registered in the data store"
			);

			assert.strictEqual(
				env.store.peekAll( "twitchChannel" ).get( "length" ),
				0,
				"Does not have any Channel records registered in the data store"
			);

			return get( record, "partner_login" )
				.then( () => {
					assert.ok(
						env.store.hasRecordForId( "twitchUser", "foo" ),
						"Store has a User record registered after accessing the partner_login"
					);

					return get( record, "channel" );
				})
				.then( () => {
					assert.ok(
						env.store.hasRecordForId( "twitchChannel", 1 ),
						"Store has a User record registered after accessing the partner_login"
					);
				});
		});

});
