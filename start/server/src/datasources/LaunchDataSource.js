
// The Apollo REST data sources have helper methods that correspond to HTTP verbs like GET and POST. In the code above, this.get('launches'), makes a GET request to  https://api.spacexdata.com/v2/launches and stores the returned launches in the response variable. Then, the getAllLaunches method maps over the launches and transforms the response from our REST endpoint with this.launchReducer. If there are no launches, an empty array is returned.

const { RESTDataSource } = require("apollo-datasource-rest");

class LaunchDataSource extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = "https://api.spacexdata.com/v2/";
  }

  async getAllLaunches() {
    const response = await this.get("launches");
    return Array.isArray(response)
      ? response.map(launch => this.launchReducer(launch))
      : [];
  }

  async getLaunchById({ launchId }) {
    console.log(`LaunchDataSource.getLaunchById ${launchId}`);

    const response = await this.get("launches", { flight_number: launchId });

    return this.launchReducer(response[0]);
  }

  getLaunchesByIds({ launchIds }) {
    return Promise.all(
      launchIds.map(launchId => this.getLaunchById({ launchId }))
    );
  }

  launchReducer(launch) {
    console.log(`LaunchDataSource.launchReducer ${launch.flight_number}`);
    return {
      id: launch.flight_number || 0,
      cursor: `${launch.launch_date_unix}`,
      site: launch.launch_site && launch.launch_site.site_name,
      mission: {
        name: launch.mission_name,
        missionPatchSmall: launch.links.mission_patch_small,
        missionPatchLarge: launch.links.mission_patch
      },
      rocket: {
        id: launch.rocket.rocket_id,
        name: launch.rocket.rocket_name,
        type: launch.rocket.rocket_type
      }
    };
  }
}

module.exports = LaunchDataSource;
