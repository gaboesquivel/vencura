// This file is auto-generated. Do not edit manually.

import * as gen from './gen/index'

export const api = {
healthCheck: gen.healthCheck,
account: {
  apikeys: {
    create: gen.accountApikeysCreate,
    list: gen.accountApikeysList,
    id: gen.accountApikeysRevoke,
  },
  profile: gen.accountProfileUpdate,
},
ai: {
  chat: gen.chat,
  generate: gen.generate,
},
auth: {
  session: {
    logout: gen.logout,
    user: gen.getUser,
  },
},
}
