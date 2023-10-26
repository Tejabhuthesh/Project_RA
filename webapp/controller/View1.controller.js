sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    
    "sap/ui/model/json/JSONModel",
	
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,
        Fragment,
        MessageBox, Formatter,
        JSONModel ,Filter,FilterOperator) {
        "use strict";

        return Controller.extend("com.agi.customapproval.controller.Main", {

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            onValueHelpRequest: function () {
                if (!this._oDialog) {
                    Fragment.load({
                        name: "com.agi.customapproval.view.fragments.MaterialList",
                        controller: this
                    }).then((oDialog) => {
                        this._oDialog = oDialog;
                        this.getView().addDependent(oDialog);
                        this._oDialog.open();
                    });
                } else {
                    this._oDialog.open();
                }
                
            },

           
            onValueHelpDialogClose: function (oEvent) {
                var sDescription,
                    oSelectedItem = oEvent.getParameter("selectedItem");
                oEvent.getSource().getBinding("items").filter([]);
    
                if (!oSelectedItem) {
                    return;
                }
    
                sDescription = oSelectedItem.getTitle();
    
                this.byId("productInput").setValue(sDescription);
               
    
            },
            onValueHelpDialogSearch: function (oEvent) {
                // var sValue = oEvent.getParameter("value");
                // var oFilter = new Filter("text", FilterOperator.Contains, sValue);
    
                // oEvent.getSource().getBinding("items").filter([oFilter]);

                
               
                if (oEvent.getId() == "search") {
                    var sQuery = oEvent.getParameter("value");
                }

                
                if (sQuery) {
                    var oFilter = new Filter('text', 'Contains', sQuery);                  
                    var oFilter1 = new Filter('key', 'Contains', sQuery);               
                    var ofilters = new Filter([oFilter, oFilter1]);
                }
                oEvent.getSource().getBinding("items").filter(ofilters);
            },
            
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


            _sCustomerPriceSet: "CustomerPriceSet",
            formatter: Formatter,
            onInit: function () {
                this._oAppView = this.getOwnerComponent().getModel("AppView");
                this._oODataModel = this.getOwnerComponent().getModel();
                this._setDefaults();
                this._getLoggedInUser();
            },

            _setDefaults: function () {
                this._oAppView.setProperty("/", {
                    vh: [{
                        text: "mobile",
                        key: "01"
                    }, {
                        text: "desktop",
                        key: "02"
                    }, {
                        text: "tablet",
                        key: "03"
                    }],
                    gclist: [{}],
                    cclist: [{}],
                    materials: [{}],
                    Codetype: "GC",
                    gc: {
                        Currency: "INR",
                        PricingUnit: "1000",
                        CustomerStatus: "N"
                    },
                    cc: {
                        Currency: "INR",
                        PricingUnit: "1000",
                        CustomerStatus: "N"
                    }
                });
                this._getLoggedInUser();
                // this._getCustomers();
            },
            onSubmitBottleWeight: function (oEvent) {
                var oModel = this.getView().getModel("AppView").getData();
                var oContext = oEvent.getSource().getBindingContext("AppView");
                let oData = oContext.getModel().getProperty(oContext.getPath());

                if (oData.ExistingPrice) {
                    oContext.getModel().setProperty(oContext.getPath() + "/ExistingPrice", (parseFloat(oData.ExistingPrice).toFixed(3) + ""));
                }

                if (oData.Amount) {
                    oContext.getModel().setProperty(oContext.getPath() + "/Amount", (parseFloat(oData.Amount).toFixed(3) + ""));
                }
                if (oData.Weight) {
                    oContext.getModel().setProperty(oContext.getPath() + "/Weight", (parseFloat(oData.Weight).toFixed(3) + ""));
                }

                let sExistingRelz, sNewRelz;
                if (oData.ExistingPrice && oData.Weight) {
                    sExistingRelz = parseInt(oData.ExistingPrice) / parseInt(oData.Weight);
                    sExistingRelz = sExistingRelz * 1000;
                    oContext.getModel().setProperty(oContext.getPath() + "/ExistingRezl", (sExistingRelz.toFixed(3) + ""));
                }
                if (oData.Amount && oData.Weight) {
                    sNewRelz = parseInt(oData.Amount) / parseInt(oData.Weight);
                    sNewRelz = sNewRelz * 1000;
                    oContext.getModel().setProperty(oContext.getPath() + "/NewRezl", (sNewRelz.toFixed(3) + ""));
                }

                if (sExistingRelz && sNewRelz) {
                    let sChangeRelz = sNewRelz - sExistingRelz;
                    oContext.getModel().setProperty(oContext.getPath() + "/ChangeRezl", (sChangeRelz.toFixed(3) + ""));
                }
            },



            onMaterialInputSubmit: function (oEvent) {
                var oModel = this.getView().getModel("AppView").getData();
                var oContext = oEvent.getSource().getBindingContext("AppView");
                let oData = oContext.getModel().getProperty(oContext.getPath());
                this._getMatnrDesc(oData.Material, oContext);
            },

            _getMatnrDesc: function (sMaterial, oContext = undefined) {
                let aFilter = [
                    new sap.ui.model.Filter({
                        path: "Matnr",
                        operator: "EQ",
                        value1: sMaterial
                    })
                ];
                sap.ui.core.BusyIndicator.show(0);
                this._oODataModel.read("/Mat0mSet", {
                    filters: sMaterial ? aFilter : [],
                    success: (oData) => {
                        sap.ui.core.BusyIndicator.hide();
                        if (oData.results.length > 0) {
                            oContext.getModel().setProperty(oContext.getPath() + "/MaterialDescription", oData.results[0].Maktg);
                        } else {
                            oContext.getModel().setProperty(oContext.getPath() + "/MaterialDescription", "");
                        }
                    },
                    error: (oError) => {
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.error(JSON.stringify(oError));
                    }
                });
            },

            _getCustomers: function () {
                this._oODataModel.read("/" + this._sCustomerPriceSet, {
                    success: (oData) => {
                        this._oAppView.setProperty("/customers", oData.results);
                    },
                    error: (oError) => {
                        MessageBox.error(JSON.stringify(oError));
                    }
                });
            },


            onAddButtonGCPress: function () {
                let aData = this._oAppView.getProperty("/gclist");
                aData = aData.length > 0 ? Array.from(aData) : [];

                aData.push({});
                this._oAppView.setProperty("/gclist", aData);
            },
            onAddButtonCCPress: function () {
                let aData = this._oAppView.getProperty("/cclist");
                aData = aData.length > 0 ? Array.from(aData) : [];

                aData.push({

                });
                this._oAppView.setProperty("/cclist", aData);
            },
            onAddButtonMatnrPress: function () {
                let aData = this._oAppView.getProperty("/materials");
                aData = aData.length > 0 ? Array.from(aData) : [];
                aData.push({});
                this._oAppView.setProperty("/materials", aData);
            },
            onCloseButtonPressMatnr: function () {

            },

            onSaveButtonPressMatnr: function () {
                this._oDialog.close();
            },

            onAddCustomCode: function () {
                if (!this._oDialog) {
                    Fragment.load({
                        name: "com.agi.customapproval.view.fragments.MaterialSelection",
                        controller: this
                    }).then((oDialog) => {
                        this._oDialog = oDialog;
                        this.getView().addDependent(oDialog);
                        this._oDialog.open();
                    });
                } else {
                    this._oDialog.open();
                }
            },
            onIconDeleteRowPress: function (oEvent) {
                var oModel = this.getView().getModel("AppView").getData();
                var oContext = oEvent.getSource().getBindingContext("AppView");
                let aData = oContext.getModel().getProperty("/materials");
                var iIndex = oContext.getPath() && oContext.getPath().split("/")[2];
                aData.splice(iIndex, 1);
                oContext.getModel().setProperty("/materials", aData);
                oContext.getModel().refresh(true);
            },

            onSaveButtonPress: function () {
                let aMaterials = this._oAppView.getProperty("/materials"),
                    sCodetype = this._oAppView.getProperty("/Codetype"),
                    oPayload, oDateRange;

                if (sCodetype === "GC") {
                    // GC
                    oPayload = this._oAppView.getProperty("/gc");
                    oPayload.Codetype = "G";
                    oDateRange = this.getView().byId("idDateRangeG");
                    if (!oDateRange.getDateValue() || !oPayload.CustomerGroup) {
                        MessageBox.error("Fill mandatory fields!")
                        return;
                    }
                } else {
                    // CC
                    oPayload = this._oAppView.getProperty("/cc");
                    oPayload.Codetype = "C";
                    oDateRange = this.getView().byId("idDateRangeC");

                    if (!oDateRange.getDateValue() || !oPayload.SalesOrg || !oPayload.DistrChannel || !oPayload.Customer) {
                        MessageBox.error("Fill mandatory fields!")
                        return;
                    }
                }


                oPayload.FormNo = "000000001";
                oPayload.Requester = this._oAppView.getProperty("/loggedInUser");
                aMaterials = Array.from(aMaterials);
                let aFilledMatnrs = aMaterials.filter((oMatnr) => oMatnr.Material);
                if (aFilledMatnrs.length === 0) {
                    MessageBox.error("Fill at least one material");
                    return;
                }
                // Add ItemNo, FormNo
                aFilledMatnrs.forEach((data, index) => {
                    if (data.Material) {

                    }
                    data.ItemNo = "" + (index + 1);
                    data.ValidFrom = oDateRange.getDateValue();
                    data.ValidTo = oDateRange.getSecondDateValue();
                    data.Currency = "INR";
                });

                oPayload.NavCustomerToMat = aFilledMatnrs;
                // sap.ui.core.BusyIndicator.show(0);
                this._oODataModel.create("/" + this._sCustomerPriceSet, oPayload, {
                    success: () => {
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.success("Created successfully", {
                            onClose: () => {
                                this._setDefaults();
                            }
                        });
                    },
                    error: (oError) => {
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.error(JSON.stringify(oError));
                    }
                });
            },


            _getLoggedInUser: function () {
                this.getOwnerComponent().getService("ShellUIService").then((oService) => {
                    let sUser = sap.ushell.Container.getService("UserInfo").getId();
                    this._oAppView.setProperty("/loggedInUser", sUser);
                });
            },

            onResetButtonPress: function () {
                this._setDefaults();
            },

            onCancelButtonPress: function () {
                this._oDialog.close();
            },

            _deleteRow: function () {

            },

            _addRow: function () {

            },

            onIconTabBarPress: function (oEvent) {

            },

            onIconTabBarPress: function (oEvent) {

            }


        });
    });
