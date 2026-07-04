import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../modules/auth/authSlice.js';
import rolesReducer from '../modules/roles/rolesSlice.js';
import areasReducer from '../modules/areas/areasSlice.js';
import peopleReducer from '../modules/people/peopleSlice.js';
import eventsReducer from '../modules/events/eventsSlice.js';
import usersReducer from '../modules/users/usersSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    roles: rolesReducer,
    areas: areasReducer,
    people: peopleReducer,
    events: eventsReducer,
    users: usersReducer,
  },
});
