import {redirect} from '@shopify/remix-oxygen';
import { REG_ID } from '~/lib/swym/swymConstants';

// if we dont implement this, /account/logout will get caught by account.$.tsx to do login

export async function loader() {
  return redirect('/');
}

/**
 * @param {ActionFunctionArgs}
 */
export async function action({context}) {
  context.session.unset(REG_ID);
  return context.customerAccount.logout();
}

/** @typedef {import('@shopify/remix-oxygen').ActionFunctionArgs} ActionFunctionArgs */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof action>} ActionReturnData */
