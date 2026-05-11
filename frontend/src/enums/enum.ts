// Single source of truth for all field-name enums.
// Import enums from here; type files re-export them for convenience.

export enum AuthField {
  Id = "id",
  Name = "name",
  Email = "email",
  Password = "password",
  ConfirmPassword = "confirmPassword",
  Role = "role",
}

export enum UserField {
  Id = "_id",
  Name = "name",
  Email = "email",
  Role = "role",
  CreatedAt = "createdAt",
  UpdatedAt = "updatedAt",
}
