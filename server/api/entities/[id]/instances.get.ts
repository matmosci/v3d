export default defineEventHandler(async (event) => {
  const { id } = event.context.params;
  const entity = await EntityModel.findOne({ _id: id, deletedAt: null });
  if (!entity) {
    return createError({
      statusCode: 404,
      statusMessage: "Entity not found",
    });
  }
  const instances = await InstanceModel.find({ entity: id }).select('-__v').lean();
  return instances;
});
