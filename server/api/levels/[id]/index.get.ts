export default defineEventHandler(async (event) => {
  const { id } = event.context.params;
  const level = await LevelModel.findById(id).select('-__v').lean();
  if (!level) {
    return createError({
      statusCode: 404,
      statusMessage: "Level not found",
    });
  }
  return level;
});
