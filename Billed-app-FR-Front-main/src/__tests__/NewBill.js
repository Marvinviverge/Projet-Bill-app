/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import userEvent from "@testing-library/user-event";
import { expect, jest, test } from '@jest/globals';

import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {

  describe("When I am on NewBill Page", () => {
    document.body.innerHTML = NewBillUI();

    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    let newBillPage = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

    test("Then mail icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-mail"));

      const mailIcon = screen.getByTestId("icon-mail");
      expect(mailIcon.getAttribute("class")).toContain("active-icon");
    });

    test("Then there should be a form to edit a new Bill", () => {
      document.body.innerHTML = NewBillUI();
      let form = screen.getByTestId("form-new-bill");
      expect(form).toBeTruthy();
    })

    test("Then the form should be submitted by clicking on the submit button", async () => {
      const handleSubmitMock = jest.fn(newBillPage.handleSubmit);
      await waitFor(() => screen.getByTestId("form-new-bill"));

      const newBillFormButton = screen.getByTestId("form-new-bill");
      newBillFormButton.addEventListener("submit", handleSubmitMock);

      fireEvent.submit(newBillFormButton);
      expect(handleSubmitMock).toHaveBeenCalled();
    });
  })

  describe("When I am on NewBill Page and I upload a file with valid format", () => {
    document.body.innerHTML = NewBillUI();

    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    let newBillPage = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

    const mockHandleChangeFile = jest.fn(newBillPage.handleChangeFile);
    const inputFile = screen.getByTestId("file");
    const file = new File(["image"], "image.jpg", { type: "image/jpg" });
    inputFile.addEventListener("change", mockHandleChangeFile);
    userEvent.upload(inputFile, file);

    test("Then it should call the handleChangeFile function", () => {
      expect(mockHandleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0]).toStrictEqual(file)
    })

    test("Then it should update the input field", () => {
      expect(inputFile.files[0].name).toBe("image.jpg");
    })
  })

  describe("When the file format is not valid", () => {
    document.body.innerHTML = NewBillUI();

    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    let newBillPage = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

    const mockHandleChangeFile = jest.fn(newBillPage.handleChangeFile);
    const inputFile = screen.getByTestId("file");
    const file = new File(["document"], "document.txt", { type: "document/txt" });
    inputFile.addEventListener("change", mockHandleChangeFile);
    fireEvent.change(inputFile, file);

    test("Then the input value should stay empty", () => {
      expect(inputFile.value).toBe("");
    })
  })

})

/*describe("Given I am connected as an employee", () => {
  describe("When I complete the required fields and submit the form", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
    });
    it("send bills from mock API POST", async () => {
      //create method
      const CreateBill = await mockStore.bills().create();
      expect(CreateBill.key).toBe("1234");

      //updat method
      const UpdateBill = await mockStore.bills().update();
      expect(UpdateBill.id).toBe("47qAXb6fIm2zOKkLzMro");
    });
  });
});*/













/*const FormDataMock = {
  append: jest.fn(),
  entries: jest.fn(),
};

jest.mock("../app/store", () => mockStore);

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
      email: "a@a",
    })
  );
  global.formData = jest.fn(() => {
    FormDataMock;
  });
});

// Init onNavigate
const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({
    pathname,
  });
};


describe("Given I am on NewBill Page", () => {
  describe("When I Submit a new file", () => {
    it("then I have to see the error message if the file type is not valid", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const Newbills = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn((e) => Newbills.handleChangeFile(e));
      const blob = new Blob(["text"], { type: "text/plain" });
      const file = new File([blob], "file.txt", { type: "text/plain" });
      const inputFile = screen.getByTestId("file");

      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [file],
        },
      });
      expect(handleChangeFile).toHaveBeenCalledTimes(1);
      expect(inputFile.files[0].type).not.toMatch(/^image\//);

      const MsgError = screen.getByTestId("file-error-msg");
      expect(MsgError).toHaveTextContent(
        "Seules les images au format JPG, JPEG ou PNG son accepté"
      );
    });
    it("then I don't see any error message if the file type is valid", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const Newbills = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn((e) => Newbills.handleChangeFile(e));
      const blob = new Blob(["image"], { type: "image/jpg" });
      const file = new File([blob], "file.txt", { type: "image/jpg" });
      const inputFile = screen.getByTestId("file");

      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [file],
        },
      });
      expect(handleChangeFile).toHaveBeenCalledTimes(1);
      expect(inputFile.files[0].type).toMatch(/^image\//);

      const MsgError = screen.getByTestId("file-error-msg");
      expect(MsgError).not.toHaveTextContent(
        "Seules les images au format JPG, JPEG ou PNG son accepté"
      );
    });
  });
});*/


