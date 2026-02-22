export default defineEventHandler(async (event) => {
  const { id } = event.context.params;
  const entity = await EntityModel.findById(id);
  if (!entity) {
    return createError({
      statusCode: 404,
      statusMessage: "Entity not found",
    });
  }
  const instances = await InstanceModel.find({ entity: id }).select('-__v').lean();
  return instances;
});
