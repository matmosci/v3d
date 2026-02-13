export default defineEventHandler(async (event) => {
  const { id } = event.context.params;
  const level = await LevelModel.findById(id);
  if (!level) {
    return createError({
      statusCode: 404,
      statusMessage: "Level not found",
    });
  }
  const instances = await InstanceModel.find({ level: id }).select('-__v').lean();
  return instances;
});
