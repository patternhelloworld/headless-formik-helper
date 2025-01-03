# Headless-Formik-Helper

> A Clean and Useful Helper Hook for useFormik

## Table of Contents
- [Features](#features)
- [Sample Codes](#sample-codes)

## Features

1. ** Show headless Formik examples using useFormik combined with Yup ** 
2. ** Eager validation for all inputs **
3. ** Functions for updating key-value pairs **
4. ** Normalization of Formik values before sending them to the server **
5. ... More features will be added over time

## Sample Codes

- Check comments in the sample code below.
  - ```javascript
      "use client";
    
      import React, {useContext, useEffect, useState} from "react";
      import {FormikErrors, FormikHelpers, FormikProps, useFormik} from "formik";
      import styles from "./productManagement.module.scss";
      import {Button, Text} from "@mantine/core";

      import {usePathname, useRouter, useSearchParams} from "next/navigation";
    
      import {
          ProductType,
          CreateProductInput,
          UpdateProductInput,
          useCreateProductMutation,
          useFindProductLazyQuery,
          useRemoveProductMutation,
          useUpdateProductMutation,
      } from "@/generated/graphql";
    
      import MemoizedTextInput from "@/components/common/form-input/MemoizedTextInput";
      import MemoizedSelect from "@/components/common/form-input/MemoizedSelect";
    
      import {GlobalToastContext} from "@/providers/GlobalToastProvider";
      import {UI_COMMON_VALUES} from "@/util/value-util";
      import {
          ExtendedCreateProductInput,
          ExtendedUpdateProductInput,
          PRODUCT_CREATE_INITIAL_VALUES,
          PRODUCT_UPDATE_INITIAL_VALUES,
          PRODUCT_VALIDATION_SCHEMA,
      } from "@/components/product/schema/crud-schema";
    
      import {useRecoilState} from "recoil";
      import {globalLoadingState} from "@/recoil/common";
      import {useIsFirstRender} from "@/hooks/useIsFirstRender";
      import {useHeadlessFormikHelper} from "@/hooks/headless-formik-helper/useHeadlessFormikHelper";
      import {CreateOrUpdateMode} from "@/hooks/headless-formik-helper/types";
    
      const ProductManagement = ({ PK_NAME }: { PK_NAME: string }) => {
          const searchParams = useSearchParams();
          const idForUpdate: number | null = Number(searchParams.get(PK_NAME));
        
          const isFirstRender = useIsFirstRender();
          const router = useRouter();
      
          const { sendErrorMsgToGlobalToast, sendSuccessMsgToGlobalToast } = useContext(GlobalToastContext);
          const [globalLoading, setGlobalLoading] = useRecoilState(globalLoadingState);
        
          const [
              fetchProduct,
              {
              data: fetchProductData,
              loading: fetchProductLoading,
              error: fetchProductError,
              },
          ] = useFindProductLazyQuery();
    
          // 1. useFormik    
          const formik: FormikProps<
              ExtendedCreateProductInput | ExtendedUpdateProductInput
            >   = useFormik<ExtendedCreateProductInput | ExtendedUpdateProductInput>({
              initialValues: {
              ...(idForUpdate
              ? PRODUCT_UPDATE_INITIAL_VALUES
              : PRODUCT_CREATE_INITIAL_VALUES),
              ...fetchProductData?.product
              },
              validationSchema: PRODUCT_VALIDATION_SCHEMA,
              validateOnMount: false,
              validateOnChange: true,
              validateOnBlur: true,
              enableReinitialize: true
          });
    
          // 2. **useHeadlessFormikHelper**
          const {
              formikValuesChanged,
              onKeyValueChangeByEventMemoized,
              onKeyValueChangeByNameValueMemoized,
              normalizeFormikValues,
              } = useHeadlessFormikHelper({
                  formik: formik,
                  eagerValidationInitialOptions: {
                      CREATE_OR_UPDATE: idForUpdate ? CreateOrUpdateMode.UPDATE : CreateOrUpdateMode.CREATE,
                      afterMileSeconds: 0,
                      keyNameToCheckFetchedForUpdate : "id"
                  }
          });
    

      const isSubmitDisabled = formik === undefined ? false : !(formik.isValid && formik.dirty);
    
      const [
          createProduct,
          {
          data: createProductData,
          loading: createProductLoading,
          error: createProductError,
      },
      ] = useCreateProductMutation();
      const [
          updateProduct,
          {
          data: updateProductData,
          loading: updateProductLoading,
          error: updateProductError,
      },
      ] = useUpdateProductMutation();
      const [
          removeProduct,
          {
          data: removeProductData,
          loading: removeProductLoading,
          error: removeProductError,
      },
      ] = useRemoveProductMutation();
    
      const createOrUpdateProduct = () => {
          if (formik.values.productType === UI_COMMON_VALUES.SELECT_OPTION_EMPTY) {
              sendErrorMsgToGlobalToast("Product type is required.", true);
              return;
          }
        
          // 3. normalizeFormikValues
          if (!idForUpdate) {
            createProduct({
              variables: {
                createProductInput: normalizeFormikValues<CreateProductInput>(formik.values),
              },
              onCompleted(data) {
                sendSuccessMsgToGlobalToast("Product created successfully.");
                redirectToList();
              },
            });
          } else {
            updateProduct({
              variables: {
                pickProductInput: { id: idForUpdate },
                updateProductInput: normalizeFormikValues<UpdateProductInput>(formik.values),
              },
              onCompleted(data) {
                sendSuccessMsgToGlobalToast("Product updated successfully.");
                router.refresh();
              },
            });
          }
      };
    
      const fetchProductWrapper = () => {
          if (idForUpdate) {
              fetchProduct({
                  variables: {
                  pickProductInput: {
                  id: idForUpdate,
                  },
              },
           });
          }
      };
    
      const redirectToList = () => {
          router.push("/products");
      };
    
      useEffect(() => {
          fetchProductWrapper();
      }, [idForUpdate]);
    
      useEffect(() => {
          if (idForUpdate && fetchProductData && !fetchProductLoading) {
              const product = fetchProductData.product;
              formik.setValues(product);
          }
      }, [fetchProductData]);
    
      return (
          <div className={styles.mainContainer}>
              <div className={styles.titleContainer}>
              <span className={styles.title}>
                Product {!idForUpdate ? "Creation" : "Update"}
              </span>
          </div>
    
            <form className={styles.form}>
              <div className={styles.field}>
                <span>
                  Product Name <span className="required-marker">*</span>
                </span>
                <MemoizedTextInput
                  name="name"
                  value={formik.values.name || ""}
                  error={formik.errors.name}
                  touched={formik.touched.name}
                  placeholder="Enter product name"
                  onChange={onKeyValueChangeByEventMemoized}
                  onBlur={formik.handleBlur}
                />
              </div>
              <div className={styles.field}>
                <span>Product Type</span>
                <MemoizedSelect
                  placeholder="Select product type"
                  data={["Physical", "Digital"]}
                  value={formik.values.productType || ""}
                  onChange={(value) => {
                    onKeyValueChangeByNameValueMemoized({
                      name: "productType",
                      value,
                    });
                  }}
                  error={formik.errors.productType}
                  touched={formik.touched.productType}
                />
              </div>
            </form>
            {formik.values.productType === ProductType.Physical && (
              <ProductTypePhysical formik={formik} />
            )}
            {formik.values.productType === ProductType.Digital && (
              <ProductTypeDigital formik={formik} />
            )}
            <div className="z-10 flex items-center sticky bottom-0 h-14 w-full bg-white justify-end space-x-2 p-2">
              <Button
                className="w-28"
                sx={{
                  color: "black",
                  backgroundColor: "#F6F6F6",
                  "&:hover": {
                    backgroundColor: "#E0E0E0",
                  },
                }}
                onClick={() => redirectToList()}
            >
                Cancel
              </Button>
    
              <Button
                className="w-28"
                sx={{
                  backgroundColor: "#26C8B9",
                  "&:hover": {
                    backgroundColor: "#1BAA9A",
                  },
                }}
                onClick={() => {
                  createOrUpdateProduct();
                }}
                disabled={isSubmitDisabled}
            >
                {!idForUpdate ? "Create" : "Update"}
              </Button>
            </div>
          </div>
      );
      };
    
      export default React.memo(ProductManagement);

    ```
  - ```javascript
      import * as Yup from "yup";
      import {
      ProductType,
      CreateProductInput,
      ProductOutput,
      UpdateProductInput,
      } from "@/generated/graphql";
      import { PRODUCT_CATEGORY_TYPE } from "@/components/product/meta/schema";
      import { UI_COMMON_VALUES } from "@/util/value-util";
      import { YUP_EMPTY_VALUE_ERROR_MESSAGE } from "@/util/yup-utils";

    /*
    *   The purpose of defining these extended types is to accommodate UI-specific requirements that differ from server constraints.
    *   For instance, "productType" is restricted to "Physical" and "Digital" on the server, but the UI may need to allow an empty value for better user experience.
    */

      export type ExtendedCreateProductInput = Omit<
        CreateProductInput,
        "productType">   & {
      productType: ProductType | "-";
      };

      export type ExtendedUpdateProductInput = Omit<
          UpdateProductInput,
          "productType"
        >   & {
          productType: ProductType | "-";
      };

      export const PRODUCT_VALIDATION_SCHEMA = Yup.object().shape({
       name: Yup.string().required(YUP_EMPTY_VALUE_ERROR_MESSAGE),
       sku: Yup.string()
      .required(YUP_EMPTY_VALUE_ERROR_MESSAGE)
      .matches(/^[a-zA-Z0-9_-]+$/, "SKU must consist of alphanumeric characters, dashes, or underscores."),
        category: Yup.mixed<string>().oneOf(
      Object.values(PRODUCT_CATEGORY_TYPE).map((value) => value.value?.toString()),
      "Invalid product category."
      )
      .required("Product category is required."),
      price: Yup.number()
      .required(YUP_EMPTY_VALUE_ERROR_MESSAGE)
      .min(0, "Price must be a positive number."),
      stock: Yup.number()
      .required(YUP_EMPTY_VALUE_ERROR_MESSAGE)
      .min(0, "Stock must be a non-negative number."),
      productType: Yup.mixed<ProductType>()
      .oneOf(Object.values(ProductType) as ProductType[], "Invalid product type.")
      .required(YUP_EMPTY_VALUE_ERROR_MESSAGE),
      description: Yup.string().nullable(),
      createdAt: Yup.date().nullable(),
      updatedAt: Yup.date().nullable(),
      });

      export const PRODUCT_CREATE_INITIAL_VALUES = {
          name: "",
          sku: "",
          category: UI_COMMON_VALUES.SELECT_OPTION_EMPTY, // Example: "Electronics"
          price: 0, // Example: 100
          stock: 0, // Example: 50
          productType: UI_COMMON_VALUES.SELECT_OPTION_EMPTY, // "Physical" or "Digital"
          description: "", // Example: "This is a sample product description."
          createdAt: undefined,
          updatedAt: undefined,
      };

      export const PRODUCT_UPDATE_INITIAL_VALUES = {
          name: "",
          sku: "",
          category: UI_COMMON_VALUES.SELECT_OPTION_EMPTY,
          price: 0,
          stock: 0,
          productType: UI_COMMON_VALUES.SELECT_OPTION_EMPTY,
          description: "",
          createdAt: undefined,
          updatedAt: undefined,
      };
    ```  