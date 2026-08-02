import assert from "node:assert/strict";
import test from "node:test";

import { validateRegistration } from "./registrationValidation.js";

test("registration does not require the removed email field", () => {
  assert.deepEqual(
    validateRegistration({
      login: "new-user",
      password: "StrongPass123!",
      passwordConfirm: "StrongPass123!",
    }),
    {},
  );
});

test("registration still validates required credentials and confirmation", () => {
  assert.deepEqual(
    validateRegistration({
      login: "   ",
      password: "secret",
      passwordConfirm: "different",
    }),
    {
      login: ["Введите логин."],
      password_confirm: ["Пароли не совпадают."],
    },
  );
});
