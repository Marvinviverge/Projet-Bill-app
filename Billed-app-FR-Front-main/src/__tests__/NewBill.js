/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import userEvent from "@testing-library/user-event";
import { expect, jest, test } from '@jest/globals';

import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js"
import BillsUI from "../views/BillsUI.js";
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
    test("Then the input value should stay empty", async () => {
      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      let newBillPage = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      const mockHandleChangeFile = jest.fn(newBillPage.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      const file = new File(["document"], "document.txt", { type: "document/txt" });
      inputFile.addEventListener("change", mockHandleChangeFile);
      fireEvent.change(inputFile, { target: { files: [file] } })
      expect(mockHandleChangeFile).toHaveBeenCalled();

      await waitFor(() => screen.getByTestId("message-error-file"));
      expect(screen.getByTestId("message-error-file").classList).not.toContain(
        "hidden"
      );
    })
  })

})

// test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I create new Bill", () => {
    test("then send bill to mock API POST", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }))
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      jest.spyOn(mockStore, "bills");
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.resolve();
          },
        };
      });
      await new Promise(process.nextTick);
      document.body.innerHTML = BillsUI({})
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }))
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();
        window.onNavigate(ROUTES_PATH.NewBill);
        jest.spyOn(mockStore, "bills");
      });

      test("send bill to an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });

        await new Promise(process.nextTick);
        document.body.innerHTML = BillsUI({ error: "Erreur 404" })
        const message = screen.getByTestId("error-message");
        expect(message.textContent).toContain("404");
      });
    });

    test("send bill to an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      await new Promise(process.nextTick);
      document.body.innerHTML = BillsUI({ error: "Erreur 500" })
      const message = screen.getByTestId("error-message");
      expect(message.textContent).toContain("500");

    });
  });
});