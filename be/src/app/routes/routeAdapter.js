function routeAdapter(controllerAuth) {
  return async (request, response) => {
    const result = await controllerAuth.handle({
      body: request.body,
      params: request.params,
      query: request.query,
      userId: request.userId,
    });
    response.status(result.statusCode).json(result.body);
  };
}

module.exports = routeAdapter;
