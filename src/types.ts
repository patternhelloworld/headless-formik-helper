import {FormikProps} from "formik";
import React from "react";

export enum CreateOrUpdateMode {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
}
export type ImmutableEagerValidationInitialOptions = Readonly<EagerValidationInitialOptions>;
export type EagerValidationInitialOptions = {
  afterMileSeconds?: number;
  CREATE_OR_UPDATE: CreateOrUpdateMode; // Enum for create or update
  keyNameToCheckFetchedForUpdate: string;
};
export type HeadlessFormikHelperOptions<T> = {
  formik: FormikProps<T>;
  eagerValidationInitialOptions?: ImmutableEagerValidationInitialOptions;
};
export type KeyValueChangeByNameIndexFieldValueMemoized<T> = {
  name: keyof T & string;
  index?: number;
  field?: string;
  value?: any;
  action?: "add" | "remove";
  newItem?: any;
};
export type KeyValueChangeByNameIndexFieldTouchedMemoized<T> = {
  name: keyof T & string;
  index: number;
  field: string;
};
export type KeyValueChangeByNameValueMemoized<T> = {
  name: keyof T & string;
  value: any;
};

export type HeadlessFormikHelperReturn<T> = {
  onKeyValueChangeByNameValue: ({
                                  name,
                                  value,
                                }: {
    name: keyof T & string;
    value: any;
  }) => void;
  onKeyValueChangeByNameIndexFieldValueMemoized: ({
                                                    name,
                                                    index,
                                                    field,
                                                    value,
                                                    action,
                                                    newItem,
                                                  }: {
    name: keyof T & string;
    index?: number;
    field?: string;
    value?: any;
    action?: "add" | "remove";
    newItem?: any;
  }) => void;
  normalizeFormikValues: <T extends Record<string, any>>(obj: T) => T;
  onKeyValueChangeByNameIndexFieldTouchedMemoized: ({
                                                      name,
                                                      index,
                                                      field,
                                                    }: {
    name: keyof T & string;
    index: number;
    field: string;
  }) => void;
  onKeyValueChangeByEvent: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyValueChangeByNameValueMemoized: ({
                                          name,
                                          value,
                                        }: KeyValueChangeByNameValueMemoized<T>) => void;
  formikValuesChanged: T | boolean;
  onKeyValueChangeByEventMemoized: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

