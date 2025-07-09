/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const ConversationsController = () => import('#controllers/conversations_controller')

router.get('/', async () => {
  return {
    hello: 'world',
    version: 'AdonisJS v6'
  }
})

router.group(() => {
  router.post('/questions', [ConversationsController, 'sendQuestion'])
  router.get('/conversation', [ConversationsController, 'getAllConversations'])
  router.get('/conversation/:id_or_uuid', [ConversationsController, 'getConversation'])
  router.delete('/conversation/:id', [ConversationsController, 'deleteConversation'])
}).prefix('/api')
