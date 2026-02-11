/**
 * Root saga
 * @format
 */
import { spawn } from 'redux-saga/effects';

import { authSagas } from '@app/module/auth/sagas';
import { profilesSagas } from '@app/module/profile/sagas';
import { commonSagas } from '@app/module/common/sagas';
import { jobsSagas } from '@app/module/jobs/sagas';
import { driversSagas } from '@app/module/drivers/sagas';
import { contractInvitationsSaga } from '@app/module/contract-invitations/sagas';

export function* rootSaga() {
  yield spawn(authSagas);
  yield spawn(profilesSagas);
  yield spawn(commonSagas);
  yield spawn(jobsSagas);
  yield spawn(driversSagas);
  yield spawn(contractInvitationsSaga);
}
