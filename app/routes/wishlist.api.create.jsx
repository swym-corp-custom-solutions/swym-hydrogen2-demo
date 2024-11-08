import { json } from "@remix-run/react";

export const action = async ({ request, context }) => {
  const formData = await request.formData();
  const actionType = formData.get('_action');
  const listName = formData.get('wishlistName');

  let data;
  try {
    data = await context.swym.createList(listName);
    return json({ data, success: true });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
};

