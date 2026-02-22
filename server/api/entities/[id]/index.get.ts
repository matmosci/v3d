export default defineEventHandler(async (event) => {
  const { id } = event.context.params;
  const entity = await EntityModel.findById(id).select('-__v').lean();
  if (!entity) {
    return createError({
      statusCode: 404,
      statusMessage: "Entity not found",
    });
  }
  return entity;
});
