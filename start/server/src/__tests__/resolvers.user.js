const resolvers = require("../resolvers");

const LaunchDataSource = require("../datasources/LaunchDataSource");
const UserDataSource = require("../datasources/UserDataSource");

describe("[User.trips]", () => {
  const mockContext = {
    dataSources: {
      UserDataSource: { getLaunchIdsByUser: jest.fn() },
      LaunchDataSource: { getLaunchesByIds: jest.fn() }
    },
    user: { id: 1 }
  };
  const { getLaunchIdsByUser } = mockContext.dataSources.UserDataSource;
  const { getLaunchesByIds } = mockContext.dataSources.LaunchDataSource;

  it("uses user id from context to lookup trips", async () => {
    getLaunchIdsByUser.mockReturnValueOnce([999]);
    getLaunchesByIds.mockReturnValueOnce([{ id: 999 }]);

    // check the resolver response
    const res = await resolvers.User.trips(null, null, mockContext);
    expect(res).toEqual([{ id: 999 }]);

    // make sure the dataSources were called properly
    expect(getLaunchIdsByUser).toBeCalled();
    expect(getLaunchesByIds).toBeCalledWith({ launchIds: [999] });
  });

  it("returns empty array if no response", async () => {
    getLaunchIdsByUser.mockReturnValueOnce([]);
    getLaunchesByIds.mockReturnValueOnce([]);

    // check the resolver response
    const res = await resolvers.User.trips(null, null, mockContext);
    expect(res).toEqual([]);
  });
});
