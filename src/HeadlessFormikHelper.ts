import { ChangeEvent, useCallback, useEffect, useRef } from 'react';
import { FormikProps } from 'formik';
import { isEqual } from 'lodash';
import {
  CreateOrUpdateMode,
  HeadlessFormikHelperOptions,
  HeadlessFormikHelperReturn,
  ImmutableEagerValidationInitialOptions,
  KeyValueChangeByNameValueMemoized,
} from './types';

export const useHeadlessFormikHelper = <T extends Record<string, any>>({
  formik,
  ...rest
}: HeadlessFormikHelperOptions<T>): HeadlessFormikHelperReturn<T> => {
  const props = {
    formik,
    ...rest,
  };
  /*
   *   [Note] To reduce unnecessary re-renders, eagerValidationInitialOptions is designed to be passed only once initially.
   *          Therefore, in the code below, only formik.values is included in the dependency array of useEffect,
   *          and eagerValidationOptions is intentionally excluded.
   */
  const eagerValidationInitialOptions = useRef(
    props.eagerValidationInitialOptions
  );

  const formikValuesChanged = !isEqual(formik.initialValues, formik.values);

  const onKeyValueChangeByEvent = (e: ChangeEvent<HTMLInputElement>) => {
    formik.setFieldTouched(e.target.name).catch(e => {
      console.error(e);
    });
    formik.handleChange(e);
  };

  const onKeyValueChangeByNameValue = ({
    name,
    value,
  }: {
    name: keyof T & string;
    value: any;
  }) => {
    formik.setFieldTouched(name).catch(e => {
      console.error(e);
    });
    formik.setFieldValue(name, value).catch(e => {
      console.error(e);
    });
  };

  const onKeyValueChangeByEventMemoized = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      formik.setFieldTouched(e.target.name).catch(e => {
        console.error(e);
      });
      formik.handleChange(e);
    },
    [formik.setFieldTouched, formik.handleChange]
  );

  const onKeyValueChangeByNameValueMemoized = useCallback(
    ({ name, value }: KeyValueChangeByNameValueMemoized<T>) => {
      formik.setFieldTouched(name).catch(e => {
        console.error(e);
      });
      formik.setFieldValue(name, value).catch(e => {
        console.error(e);
      });
    },
    [formik.setFieldTouched, formik.setFieldValue]
  );

  /*
   *   Updating structures with a Key => Value(Array) format, rather than a Key => Value(String, number, etc.) format.
   *   However, for this sort of case, it is recommended to set Formiks respectively for each child.
   * */
  const onKeyValueChangeByNameIndexFieldValueMemoized = useCallback(
    ({
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
      action?: 'add' | 'remove'; // For Update, leave this undefined.
      newItem?: any;
    }) => {
      if (Array.isArray(formik.values[name])) {
        const updatedInfo = [...(formik.values[name] as Array<any>)];
        const updatedTouched = Array.isArray(formik.touched[name])
          ? [...(formik.touched[name] as Array<any>)]
          : [];

        if (action === 'add') {
          if (newItem) {
            updatedInfo.push(newItem);
            updatedTouched.push({});
          } else {
            console.error(
              'For C(Create) : newItem is required for adding a new entry.'
            );
          }
        } else if (action === 'remove') {
          if (
            typeof index === 'number' &&
            index >= 0 &&
            index < updatedInfo.length
          ) {
            updatedInfo.splice(index, 1);
            updatedTouched.splice(index, 1);
          } else {
            console.error(
              `For D(Delete) one of Arrays : Invalid index: ${index}.`
            );
          }
        } else if (
          typeof index === 'number' &&
          index >= 0 &&
          index < updatedInfo.length &&
          field
        ) {
          updatedInfo[index] = {
            ...updatedInfo[index],
            [field]: value,
          };
          updatedTouched[index] = {
            ...updatedTouched[index],
            [field]: true,
          };
        } else {
          console.error(
            `For U(Update) : Invalid index: ${index} or field: ${field}`
          );
          return;
        }

        formik
          .setTouched({ ...formik.touched, [name]: updatedTouched })
          .catch(e => {
            console.error(e);
          });
        formik.setFieldValue(name, updatedInfo).catch(e => {
          console.error(e);
        });
      } else {
        console.error(`Invalid name or value structure for name: ${name}`);
      }
    },
    [formik.setFieldValue, formik.setTouched, formik.values, formik.touched]
  );

  const onKeyValueChangeByNameIndexFieldTouchedMemoized = useCallback(
    ({
      name,
      index,
      field,
    }: {
      name: keyof T & string;
      index: number;
      field: string;
    }) => {
      const updatedTouched = Array.isArray(formik.touched[name])
        ? [...(formik.touched[name] as Array<any>)]
        : [];

      // Ensure intermediate indexes are initialized
      for (let i = updatedTouched.length; i <= index; i++) {
        updatedTouched[i] = updatedTouched[i] || {};
      }

      updatedTouched[index] = {
        ...updatedTouched[index],
        [field]: true,
      };

      formik
        .setTouched({ ...formik.touched, [name]: updatedTouched })
        .catch(e => {
          console.error(e);
        });
    },
    [formik.touched]
  );

  /*
   * GraphQL has strict type requirements, so it distinguishes between "" and undefined on the server side.
   * For example, if the parameter `regNo` has a value, it must be provided.
   * If it doesn't have a value, `regNo = undefined` should be sent to avoid errors.
   * Sending `regNo = ""` will result in an error.
   */
  const normalizeFormikValues = <T extends Record<string, any>>(obj: T): T => {
    const recursiveNormalize = (
      nestedObj: Record<string, any>
    ): Record<string, any> => {
      Object.entries(nestedObj).forEach(([key, value]) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Recurse into nested objects
          nestedObj[key] = recursiveNormalize(value);
        } else if (Array.isArray(value)) {
          // Handle arrays
          nestedObj[key] = value.map(item =>
            typeof item === 'object' && item !== null
              ? recursiveNormalize(item)
              : item
          );
        } else {
          // Handle primitive values
          if (
            formik.touched[key] &&
            formik.initialValues[key] === undefined &&
            typeof value === 'string' &&
            value.trim() === ''
          ) {
            delete nestedObj[key]; // Remove empty string
          }
        }
      });

      return nestedObj;
    };

    return recursiveNormalize(obj) as T; // Processed object returned
  };

  /**
   * Recursively sets all properties of an object to `true` for Formik's touched state.
   * Handles nested objects and arrays.
   *
   * @param obj - The object whose properties will be set to `true`.
   * @returns A new object with the same structure but all values set to `true`.
   */
  const setTouchedRecursive = (obj: any): any => {
    return Object.keys(obj).reduce((acc, key) => {
      if (Array.isArray(obj[key])) {
        // Handle arrays
        acc[key] = obj[key].map((item: any) =>
          typeof item === 'object' && item !== null
            ? setTouchedRecursive(item)
            : true
        );
      } else if (obj[key] && typeof obj[key] === 'object') {
        // Handle objects
        acc[key] = setTouchedRecursive(obj[key]);
      } else {
        // Handle primitive values
        acc[key] = true;
      }
      return acc;
    }, {});
  };

  /**
   * Updates the Formik touched state based on eager validation options.
   * Differentiates between CREATE and UPDATE modes.
   *
   * @param eagerValidationInitialOptions - Options to determine the validation mode and primary key.
   * @param formik - The Formik instance used for form state management.
   */
  const handleEagerTouchedInitialState = (
    eagerValidationInitialOptions:
      | ImmutableEagerValidationInitialOptions
      | undefined,
    formik: FormikProps<T>
  ) => {
    if (eagerValidationInitialOptions !== undefined) {
      if (
        eagerValidationInitialOptions.CREATE_OR_UPDATE ===
        CreateOrUpdateMode.UPDATE
      ) {
        // This means, data for U(Update) has been set.
        if (
          formik.initialValues[
            eagerValidationInitialOptions.keyNameToCheckFetchedForUpdate
          ] !== undefined
        ) {
          // Delay to ensure values are updated before setting touched state
          setTimeout(
            () => {
              formik
                .setTouched(setTouchedRecursive(formik.initialValues))
                .catch(e => console.error(e));
            },
            eagerValidationInitialOptions.afterMileSeconds
              ? eagerValidationInitialOptions.afterMileSeconds
              : 0
          );
        }
      } else {
        // In the case of "CREATE"
        setTimeout(
          () => {
            formik
              .setTouched(setTouchedRecursive(formik.initialValues))
              .catch(e => console.error(e));
          },
          eagerValidationInitialOptions.afterMileSeconds
            ? eagerValidationInitialOptions.afterMileSeconds
            : 0
        );
      }
    }
  };

  useEffect(() => {
    /**
     * Effect to manage Formik's touched state based on changes to form values.
     */
    handleEagerTouchedInitialState(
      eagerValidationInitialOptions.current,
      formik
    );
    /*
     *   props.eagerValidationInitialOptions : should be ignored.
     * */
  }, [formik.initialValues]);

  return {
    formikValuesChanged,
    onKeyValueChangeByEvent,
    onKeyValueChangeByNameValue,
    onKeyValueChangeByEventMemoized,
    onKeyValueChangeByNameValueMemoized,
    onKeyValueChangeByNameIndexFieldTouchedMemoized,
    onKeyValueChangeByNameIndexFieldValueMemoized,
    normalizeFormikValues,
  };
};
