const { paginateResults } = require("./utils");

module.exports = {
  Query: {
    launches: async (_, { pageSize = 5, after }, { dataSources }) => {
      const allLaunches = await dataSources.LaunchDataSource.getAllLaunches();

      console.log(`paginateResults pageSize ${pageSize}`);

      // we want these in reverse chronological order
      allLaunches.reverse();

      const launches = paginateResults({
        after,
        pageSize,
        results: allLaunches
      });

      return {
        launches,
        cursor: launches.length ? launches[launches.length - 1].cursor : null,
        // if the cursor of the end of the paginated results is the same as the
        // last item in _all_ results, then there are no more results after this
        hasMore: launches.length
          ? launches[launches.length - 1].cursor !==
            allLaunches[allLaunches.length - 1].cursor
          : false
      };
    },

    launch: (_, { id }, { dataSources }) => {
      console.log(`Query.getLaunchById`);
      return dataSources.LaunchDataSource.getLaunchById({ launchId: id });
    },

    me: (_, __, { dataSources }) => {
      return dataSources.UserDataSource.findOrCreateUser();
    }
  },

  Mutation: {
    login: async (_, { email }, { dataSources }) => {
      const user = await dataSources.UserDataSource.findOrCreateUser({
        email
      });
      if (user) return Buffer.from(email).toString("base64");
    },

    bookTrips: async (_, { launchIds }, { dataSources }) => {
      const results = await dataSources.UserDataSource.bookTrips({
        launchIds
      });
      const launches = await dataSources.LaunchDataSource.getLaunchesByIds({
        launchIds
      });

      return {
        success: results && results.length === launchIds.length,
        message:
          results.length === launchIds.length
            ? "trips booked successfully"
            : `the following launches couldn't be booked: ${launchIds.filter(
                id => !results.includes(id)
              )}`,
        launches
      };
    },

    cancelTrip: async (_, { launchId }, { dataSources }) => {
      const result = await dataSources.UserDataSource.cancelTrip({
        launchId
      });

      if (!result)
        return {
          success: false,
          message: "failed to cancel trip"
        };

      const launch = await dataSources.LaunchDataSource.getLaunchById({
        launchId
      });
      return {
        success: true,
        message: "trip cancelled",
        launches: [launch]
      };
    }
  },

  //It's important to note that you can write resolvers for any types in your schema, not just queries and mutations

  Mission: {
    //The first argument passed into our resolver is the parent, which refers to the mission object. The second argument is the size we pass to our missionPatch field, which we use to determine which property on the mission object we want our field to resolve to.
    // make sure the default size is 'large' in case user doesn't specify
    missionPatch: (mission, { size } = { size: "LARGE" }) => {
      console.log("mission.missionPatch resolver");
      return size === "SMALL"
        ? mission.missionPatchSmall
        : mission.missionPatchLarge;
    }
  },

  Launch: {
    isBooked: async (launch, _, { dataSources }) => {
      return dataSources.UserDataSource.isBookedOnLaunch({
        launchId: launch.id
      });
    }
  },

  User: {
    trips: async (_, __, { dataSources }) => {
      // get ids of launches by user
      const launchIds = await dataSources.UserDataSource.getLaunchIdsByUser();

      if (!launchIds.length) return [];

      // look up those launches by their ids
      return (
        dataSources.LaunchDataSource.getLaunchesByIds({
          launchIds
        }) || []
      );
    }
  }
};
