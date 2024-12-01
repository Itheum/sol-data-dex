import React, { useEffect, useState } from "react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Link,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  Stepper,
  StepSeparator,
  StepStatus,
  StepTitle,
  Tag,
  Text,
  Textarea,
  Image,
  Heading,
  Highlight,
  useColorMode,
  useSteps,
  useToast,
} from "@chakra-ui/react";
import { Program } from "@coral-xyz/anchor";
import { yupResolver } from "@hookform/resolvers/yup";
import { CNftSolMinter } from "@itheum/sdk-mx-data-nft/out";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { Controller, useForm } from "react-hook-form";
import * as Yup from "yup";
import extraAssetDemo from "assets/img/extra-asset-demo.gif";
import darkFreeMintNFMeIDHero from "assets/img/landing/nfme/dark-hero-nfme-landing-page.jpg";
import liteFreeMintNFMeIDHero from "assets/img/landing/nfme/lite-hero-nfme-landing-page.jpg";
import darkNFMeIDHero from "assets/img/nfme/dark-nfmeid-vault-mint-page-hero.jpg";
import liteNFMeIDHero from "assets/img/nfme/lite-nfmeid-vault-mint-page-hero.jpg";
import { ConfirmationDialog } from "components/UtilComps/ConfirmationDialog";
import { PopoverTooltip } from "components/UtilComps/PopoverTooltip";
import { useNetworkConfiguration } from "contexts/sol/SolNetworkConfigurationProvider";
import { UserDataType } from "libs/Bespoke/types";
import { IS_DEVNET, PRINT_UI_DEBUG_PANELS } from "libs/config";
import { labels } from "libs/language";
import { BONDING_PROGRAM_ID, SOLANA_EXPLORER_URL, BOND_CONFIG_INDEX } from "libs/Solana/config";
import { CoreSolBondStakeSc, IDL } from "libs/Solana/CoreSolBondStakeSc";
import {
  createBondTransaction,
  fetchRewardsConfigSol,
  fetchSolNfts,
  getOrCacheAccessNonceAndSignature,
  sendAndConfirmTransaction,
  getInitAddressBondsRewardsPdaTransaction,
  createAddBondAsVaultTransaction,
  getBondingProgramInterface,
} from "libs/Solana/utils";

import { getApiDataMarshal, isValidNumericCharacter, sleep, timeUntil } from "libs/utils";
import { useAccountStore, useMintStore } from "store";
import { useNftsStore } from "store/nfts";
import { MintingModal } from "./MintingModal";

type TradeDataFormType = {
  dataStreamUrlForm: string;
  dataPreviewUrlForm: string;
  tokenNameForm: string;
  datasetTitleForm: string;
  datasetDescriptionForm: string;
  extraAssets?: string;
  numberOfCopiesForm: number;
  royaltiesForm: number;
  bondingAmount?: number;
  bondingPeriod?: number;
};

type TradeFormProps = {
  checkUrlReturns200: (url: string, sendBackResponse?: boolean) => Promise<{ message: string; isSuccess: boolean; callResponse?: string }>;
  maxSupply: number;
  minRoyalties: number;
  maxRoyalties: number;
  antiSpamTax: number;
  dataNFTMarshalServiceStatus: boolean;
  userData: UserDataType | undefined;
  dataToPrefill: any;
  closeTradeFormModal: () => void;
};

export const TradeForm: React.FC<TradeFormProps> = (props) => {
  const { checkUrlReturns200, maxSupply, minRoyalties, maxRoyalties, antiSpamTax, dataNFTMarshalServiceStatus, userData, dataToPrefill, closeTradeFormModal } =
    props;
  const { isFreeMint } = dataToPrefill;
  const showInlineErrorsBeforeAction = false;
  const enableBondingInputForm = false;
  const { publicKey: userPublicKey, sendTransaction, signMessage } = useWallet();
  const { connection } = useConnection();
  const { networkConfiguration } = useNetworkConfiguration();
  const [bondTransaction, setBondTransaction] = useState<Transaction | undefined>(undefined);
  const [nextBondId, setNextBondId] = useState<number | undefined>(undefined); // if the bond tx passes, this will be the bond id of the new bond
  const [dataNftNonce, setDataNftNonce] = useState<number | undefined>(undefined); // is the nonce (leaf_id) of the data nft we just minted
  const itheumBalance = useAccountStore((state) => state.itheumBalance);
  const { colorMode } = useColorMode();
  const toast = useToast();
  // const lockPeriod = useMintStore((state) => state.lockPeriodForBond);
  const dataNFTMarshalService: string = getApiDataMarshal();
  const [isNFMeIDMint, setIsNFMeIDMint] = useState<boolean>(false);
  const [currDataCATSellObj] = useState<any>(dataToPrefill ?? null);
  const [readTermsChecked, setReadTermsChecked] = useState<boolean>(false);
  const [readAntiSpamFeeChecked, setReadAntiSpamFeeChecked] = useState<boolean>(false);
  const [readLivelinessBonding, setReadLivelinessBonding] = useState<boolean>(false);
  const [isMintingModalOpen, setIsMintingModalOpen] = useState<boolean>(false);
  const [errDataNFTStreamGeneric, setErrDataNFTStreamGeneric] = useState<any>(null);
  const [mintingSuccessful, setMintingSuccessful] = useState<boolean>(false);
  // const [makePrimaryNFMeIdSuccessful, setMakePrimaryNFMeIdSuccessful] = useState<boolean>(false);
  const [dataNFTImg, setDataNFTImg] = useState<string>("");
  const [dataNFTTraits, setDataNFTTraits] = useState<any>(undefined);
  const [saveProgress, setSaveProgress] = useState({ s1: 0, s2: 0, s3: 0, s4: 0 });
  const [previousDataNFTStreamUrl, setPreviousDataNFTStreamUrl] = useState<string>("");
  const [wasPreviousCheck200StreamSuccess, setWasPreviousCheck200StreamSuccess] = useState<boolean>(false);
  const steps = [
    { title: "Step 1", description: "Asset Detail" },
    { title: "Step 2", description: "Token Metadata" },
    { title: "Step 3", description: "Bonding & Terms" },
  ];
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });
  const [maxApy, setMaxApy] = useState<number>(80);
  const [needsMoreITHEUMToProceed, setNeedsMoreITHEUMToProceed] = useState<boolean>(false);
  const updateItheumBalance = useAccountStore((state) => state.updateItheumBalance);
  const updateAllDataNfts = useNftsStore((state) => state.updateAllDataNfts);
  const [bondingTxHasFailed, setBondingTxHasFailed] = useState<boolean>(false);
  const [solNFMeIDMintConfirmationWorkflow, setSolNFMeIDMintConfirmationWorkflow] = useState<boolean>(false);
  const [solBondingConfigObtainedFromChainErr, setSolBondingConfigObtainedFromChainErr] = useState<boolean>(false);
  const { usersNfMeIdVaultBondId, lockPeriodForBond } = useMintStore();
  const [bondingProgram, setBondingProgram] = useState<Program<CoreSolBondStakeSc> | undefined>();
  const [isAutoVaultInProgress, setIsAutoVaultInProgress] = useState<boolean>(false);

  // S: Cached Signature Store Items
  const solPreaccessNonce = useAccountStore((state: any) => state.solPreaccessNonce);
  const solPreaccessSignature = useAccountStore((state: any) => state.solPreaccessSignature);
  const solPreaccessTimestamp = useAccountStore((state: any) => state.solPreaccessTimestamp);
  const updateSolPreaccessNonce = useAccountStore((state: any) => state.updateSolPreaccessNonce);
  const updateSolPreaccessTimestamp = useAccountStore((state: any) => state.updateSolPreaccessTimestamp);
  const updateSolSignedPreaccess = useAccountStore((state: any) => state.updateSolSignedPreaccess);
  // E: Cached Signature Store Items

  // S: React hook form + yup integration ---->
  // Declaring a validation schema for the form with the validation needed
  let preSchema = {
    dataStreamUrlForm: Yup.string()
      .required("Data Stream URL is required")
      .notOneOf(["https://drive.google.com"], `Data Stream URL doesn't accept Google Drive URLs`)
      .test("is-url-or-ipns", "Data Stream URL must be a valid HTTPS, IPFS or IPNS URL", function (value) {
        const websiteRegex = new RegExp(
          "^(http|https?:\\/\\/)?" + // validate protocol
            "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // validate domain name
            "((\\d{1,3}\\.){3}\\d{1,3}))" + // validate OR ip (v4) address
            "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // validate port and path
            "(\\?[;&a-z\\d%_.~+=-]*)?" + // validate query string
            "(\\#[-a-z\\d_]*)?$",
          "i"
        ); // validate fragment locator;
        const ipfsIpnsUrlRegex = /^(ipfs|ipns):\/\/[a-zA-Z0-9]+$/gm;
        return websiteRegex.test(value) || ipfsIpnsUrlRegex.test(value.split("?")[0]);
      })
      .test("is-distinct", "Data Stream URL cannot be the same as the Data Preview URL", function (value) {
        return value !== this.parent.dataPreviewUrlForm;
      })
      .test("is-200", "Data Stream URL must be public", async function (value: string) {
        if (previousDataNFTStreamUrl !== value) {
          const { isSuccess, message } = await checkUrlReturns200(value);
          setPreviousDataNFTStreamUrl(value);
          setWasPreviousCheck200StreamSuccess(isSuccess);
          if (!isSuccess) {
            return this.createError({ message });
          } else {
            return true;
          }
        } else {
          return wasPreviousCheck200StreamSuccess;
        }
      }),

    dataPreviewUrlForm: Yup.string()
      .required("Data Preview URL is required")
      .url("Data Preview must be valid URL")
      .notOneOf(["https://drive.google.com"], `Data Preview URL doesn't accept Google Drive URLs`)
      .test("is-distinct", "Data Preview URL cannot be the same as the Data Stream URL", function (value) {
        return value !== this.parent.dataStreamUrlForm;
      }),

    tokenNameForm: Yup.string()
      .required("Token name is required")
      .matches(/^[a-zA-Z0-9]+$/, "Only alphanumeric characters are allowed")
      .min(3, "Token name must have at least 3 characters.")
      .max(20, "Token name must have maximum of 20 characters."),

    datasetTitleForm: Yup.string()
      .required("Dataset title is required")
      .matches(/^[a-zA-Z0-9\s]+$/, "Only alphanumeric characters are allowed")
      .min(10, "Dataset title must have at least 10 characters.")
      .max(60, "Dataset title must have maximum of 60 characters."),

    datasetDescriptionForm: Yup.string()
      .required("Dataset description is required")
      .min(10, "Dataset description must have at least 10 characters.")
      .max(400, "Dataset description must have maximum of 400 characters."),

    extraAssets: Yup.string()
      .optional()
      .url("Extra Asset URL must be a valid URL")
      .test("is-200", "Extra Asset URL must be public", async function (value: string | undefined) {
        if (value) {
          const { isSuccess, message } = await checkUrlReturns200(value);
          if (!isSuccess) {
            return this.createError({ message });
          }
          return true;
        } else {
          return true;
        }
      }),

    numberOfCopiesForm: Yup.number()
      .typeError("Number of copies must be a number.")
      .min(1, "Minimum number of copies should be 1 or greater.")
      .max(maxSupply, `Number of copies should be less than ${maxSupply}.`)
      .required("Number of copies is required"),

    royaltiesForm: Yup.number()
      .typeError("Royalties must be a number.")
      .min(0, "Minimum value of royalties is 0%.")
      .max(maxRoyalties, `Maximum value of royalties is ${maxRoyalties}`)
      .required("Royalties is required"),
  };

  const bondingPreSchema = {
    bondingAmount: Yup.number()
      .typeError("Bonding amount must be a number.")
      .min(1, "Minimum value of bonding amount is 10 ITHEUM.")
      .required("Bond Deposit is required"),
    bondingPeriod: Yup.number()
      .typeError("Bonding period must be a number.")
      .min(0, "Minimum value of bonding period is 3 months.")
      .required("Bonding Period is required"),
  };

  preSchema = { ...preSchema, ...bondingPreSchema };

  const validationSchema = Yup.object().shape(preSchema);
  const amountOfTime = lockPeriodForBond.length > 0 ? timeUntil(lockPeriodForBond[0]?.lockPeriod) : { count: -1, unit: "-1" };
  // Destructure the methods needed from React Hook Form useForm component
  const {
    control,
    formState: { errors, isValid },
    handleSubmit,
    getValues,
    trigger,
  } = useForm<TradeDataFormType>({
    defaultValues: {
      dataStreamUrlForm: dataToPrefill?.additionalInformation.dataStreamURL ?? "",
      dataPreviewUrlForm: dataToPrefill?.additionalInformation.dataPreviewURL ?? "",
      tokenNameForm: dataToPrefill?.additionalInformation?.tokenName.replaceAll(" ", "").substring(0, 16) ?? "",
      datasetTitleForm: dataToPrefill?.additionalInformation?.programName ?? "",
      datasetDescriptionForm: dataToPrefill?.additionalInformation.description ?? "",
      extraAssets: dataToPrefill?.additionalInformation.extraAssets ?? "",
      numberOfCopiesForm: 1,
      royaltiesForm: 0,
      bondingAmount:
        lockPeriodForBond.length > 0
          ? userPublicKey
            ? BigNumber(lockPeriodForBond[0]?.amount).toNumber()
            : BigNumber(lockPeriodForBond[0]?.amount)
                .dividedBy(10 ** 18)
                .toNumber()
          : -1,
      bondingPeriod: lockPeriodForBond.length > 0 && amountOfTime?.count !== -1 ? amountOfTime?.count : -1,
    }, // declaring default values for inputs not necessary to declare
    mode: "onChange", // mode stay for when the validation should be applied
    resolver: yupResolver(validationSchema), // telling to React Hook Form that we want to use yupResolver as the validation schema
  });

  const dataNFTStreamUrl: string = isNFMeIDMint ? generatePrefilledNFMeIDDataStreamURL() : getValues("dataStreamUrlForm");
  const dataNFTPreviewUrl: string = getValues("dataPreviewUrlForm");
  const dataNFTTokenName: string = getValues("tokenNameForm");
  const datasetTitle: string = getValues("datasetTitleForm");
  const datasetDescription: string = getValues("datasetDescriptionForm");
  const extraAssets: string = getValues("extraAssets") ?? "";
  const dataNFTCopies: number = isNFMeIDMint ? 5 : getValues("numberOfCopiesForm");
  const dataNFTRoyalties: number = isNFMeIDMint ? 2 : getValues("royaltiesForm");
  const bondingAmount: number = getValues("bondingAmount") ?? -1;
  const bondingPeriod: number = getValues("bondingPeriod") ?? -1;

  function generatePrefilledNFMeIDDataStreamURL() {
    // append the imgswapsalt to make the image unique to the user
    const userAddress = userPublicKey?.toBase58();

    if (!userAddress) {
      return;
    }

    // create the dynamic NFMeID URL for this user
    let nfmeIdVaultDataStreamURL = dataToPrefill?.additionalInformation.dataStreamURL;

    if (!IS_DEVNET) {
      nfmeIdVaultDataStreamURL = dataToPrefill?.additionalInformation.dataStreamURL_PRD;
    }

    // if it's solana then append chain=sol
    let chainMeta = "";

    if (userPublicKey) {
      chainMeta = "&chain=sol";
    }

    const imgSwapSalt = `&imgswapsalt=${userAddress.substring(0, 6)}-${userAddress.slice(-6)}_timestamp_${Date.now()}${chainMeta}`;

    nfmeIdVaultDataStreamURL = nfmeIdVaultDataStreamURL + imgSwapSalt;

    return nfmeIdVaultDataStreamURL;
  }
  // E: React hook form + yup integration ---->

  useEffect(() => {
    if (currDataCATSellObj && currDataCATSellObj?.isNFMeID === true) {
      setIsNFMeIDMint(true);
      // everything is prefilled, so we can go to the last step of thr stepper, but we can also hide the stepper header in the UI
      setActiveStep(2);
    }
  }, [currDataCATSellObj]);

  useEffect(() => {
    // check if we got the data for lockPeriodForBond from Solana Program (lockPeriodForBond also is for MVX, but not checking that here)
    if (userPublicKey) {
      if (lockPeriodForBond?.length === 0) {
        setSolBondingConfigObtainedFromChainErr(true);
      } else {
        setSolBondingConfigObtainedFromChainErr(false);
      }
    }
  }, [lockPeriodForBond]);

  useEffect(() => {
    async function fetchBondingRelatedDataFromSolana() {
      if (userPublicKey) {
        // const programId = new PublicKey(BONDING_PROGRAM_ID);
        // const program = new Program<CoreSolBondStakeSc>(IDL, programId, {
        //   connection,
        // });

        const programObj = getBondingProgramInterface(connection);

        setBondingProgram(programObj.programInterface);

        fetchRewardsConfigSol(programObj.programInterface).then((rewardsT: any) => {
          if (rewardsT?.error) {
            setSolBondingConfigObtainedFromChainErr(true);
            setMaxApy(-1);
          } else {
            setSolBondingConfigObtainedFromChainErr(false);
            setMaxApy(rewardsT.maxApr);
          }
        });
      }
    }
    fetchBondingRelatedDataFromSolana();
  }, [userPublicKey]);

  useEffect(() => {
    if (itheumBalance && antiSpamTax && bondingAmount) {
      // check if "defaults" are passed (i.e. we have the final values to calculate)
      if (itheumBalance >= 0 && antiSpamTax >= 0 && antiSpamTax >= 0) {
        if (itheumBalance < antiSpamTax + bondingAmount) {
          // we can use this to send a CTA to get them to buy ITHEUM tokens on the market
          setNeedsMoreITHEUMToProceed(true);
        }
      }
    }
  }, [itheumBalance, antiSpamTax, bondingAmount]);

  useEffect(() => {
    if (bondTransaction) {
      sendSolanaBondingTx();
    }
  }, [bondTransaction]);

  function shouldMintYourDataNftBeDisabled(): boolean | undefined {
    if (!isFreeMint) {
      return !isValid || !readTermsChecked || !readLivelinessBonding || solBondingConfigObtainedFromChainErr || itheumBalance < bondingAmount;
    } else {
      return !isValid || !readTermsChecked || solBondingConfigObtainedFromChainErr;
    }
  }

  const closeProgressModal = () => {
    if (mintingSuccessful) {
      toast({
        title: 'Success! Head over to your "Wallet" to view your new Data NFT or head over to Liveliness if you want to stake against your NFMe ID',
        status: "success",
        isClosable: true,
      });
    }

    // reset all the key state
    setIsMintingModalOpen(false);
    setSaveProgress({ s1: 0, s2: 0, s3: 0, s4: 0 });
    setMintingSuccessful(false);
    // setMakePrimaryNFMeIdSuccessful(false);
    setDataNFTImg("");
    closeTradeFormModal();
    setBondTransaction(undefined);
    setNextBondId(undefined);
    setDataNftNonce(undefined);
    setIsAutoVaultInProgress(false);
  };

  function validateBaseInput() {
    // validate that all URLs are of a supported network protocol
    const isValidProtocol = (url: string) => {
      return url.startsWith("https://") || url.startsWith("ipfs://") || url.startsWith("ipns://");
    };

    if (!isValidProtocol(dataNFTStreamUrl) || !dataNFTPreviewUrl.startsWith("https://") || !dataNFTMarshalService.startsWith("https://")) {
      toast({
        title: labels.ERR_URL_MISSING_HTTPS_OR_IPNS,
        status: "error",
        isClosable: true,
        duration: 20000,
      });
      return true;
    } else {
      return true;
    }
  }

  // once we save the img and json to IPFS, we have to ping to make sure it's there in order to verify the ipfs service worked
  // ... or else we mint a NFT that may have broken img and json. We can try upto 3 times to confirm, and if not - show an error to user
  async function confirmIfNftImgAndMetadataIsAvailableOnIPFS(imageUrlOnIPFS: string, metadataUrlOnIPFS: string) {
    const imgCIDOnIPFS = imageUrlOnIPFS.split("ipfs/")[1];
    const metadataCIDOnIPFS = metadataUrlOnIPFS.split("ipfs/")[1];

    const imgOnIPFSCheckResult = await checkUrlReturns200(`https://gateway.pinata.cloud/ipfs/${imgCIDOnIPFS}`);
    const metadataOnIPFSCheckResult = await checkUrlReturns200(`https://gateway.pinata.cloud/ipfs/${metadataCIDOnIPFS}`, true);

    if (imgOnIPFSCheckResult.isSuccess && metadataOnIPFSCheckResult.isSuccess) {
      let dataNFTTraitsFromRes;

      if (metadataOnIPFSCheckResult.callResponse) {
        dataNFTTraitsFromRes = JSON.parse(metadataOnIPFSCheckResult.callResponse).attributes;
      }

      return {
        result: true,
        dataNFTTraitsFromRes,
      };
    } else {
      return { result: false, dataNFTTraitsFromRes: null };
    }
  }

  const dataNFTSellSubmit = async () => {
    if (!userPublicKey) {
      toast({
        title: labels.ERR_MINT_FORM_NO_WALLET_CONN,
        status: "error",
        isClosable: true,
        duration: 20000,
      });
      return;
    }

    const isValidInput = validateBaseInput();

    if (isValidInput) {
      setErrDataNFTStreamGeneric(null);
      setMintingSuccessful(false);
      // setMakePrimaryNFMeIdSuccessful(false);
      setIsMintingModalOpen(true);

      // we simulate the "encrypting" step for UX, as this was prev done manually and now its all part of the .mint() SDK
      await sleep(2);

      setSaveProgress((prevSaveProgress) => ({ ...prevSaveProgress, s1: 1 }));

      await sleep(2);

      mintDataNftSol();
    }
  };

  // const prepareMint = async () => {
  //   await sleep(1);
  //   setSaveProgress((prevSaveProgress) => ({ ...prevSaveProgress, s2: 1 }));

  //   await mintDataNftSol();
  // };

  const mintDataNftSol = async () => {
    setSaveProgress((prevSaveProgress) => ({ ...prevSaveProgress, s2: 1 }));

    await sleep(2);

    try {
      const cNftSolMinter = new CNftSolMinter(IS_DEVNET ? "devnet" : "mainnet");
      const optionalSDKMintCallFields: Record<string, any> = {
        nftStorageToken: import.meta.env.VITE_ENV_NFT_STORAGE_KEY,
        extraAssets: [],
      };

      if (extraAssets && extraAssets.trim() !== "" && extraAssets.trim().toUpperCase() !== "NA") {
        optionalSDKMintCallFields["extraAssets"] = [extraAssets.trim()];
      }

      // if it's nfme id vault, get the custom image layers
      if (isNFMeIDMint) {
        optionalSDKMintCallFields["imgGenBg"] = "bg5_series_nfmeid_gen1";
        optionalSDKMintCallFields["imgGenSet"] = "set9_series_nfmeid_gen1";
      }

      if (!userPublicKey) {
        return;
      }

      const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
        solPreaccessNonce,
        solPreaccessSignature,
        solPreaccessTimestamp,
        signMessage,
        publicKey: userPublicKey,
        updateSolPreaccessNonce,
        updateSolSignedPreaccess,
        updateSolPreaccessTimestamp,
      });

      if (usedPreAccessNonce && usedPreAccessSignature) {
        optionalSDKMintCallFields["signatureNonce"] = usedPreAccessNonce;
        optionalSDKMintCallFields["solSignature"] = usedPreAccessSignature;
      }

      const {
        imageUrl: _imageUrl,
        metadataUrl: _metadataUrl,
        mintMeta: mintMeta,
      } = await cNftSolMinter.mint(
        userPublicKey?.toBase58(),
        dataNFTTokenName,
        dataNFTMarshalService,
        dataNFTStreamUrl,
        dataNFTPreviewUrl,
        datasetTitle,
        datasetDescription,
        optionalSDKMintCallFields
      );

      // check if any errors (they come as a string - e.g. {\"error\":\"you are not whitelisted to mint\"})
      let errorMsg = null;
      let tryParseForPossibleErrs = null;

      try {
        // note that this parse will fail if it was a success
        tryParseForPossibleErrs = JSON.parse(mintMeta.toString());
      } catch (e) {
        console.log(e);
      }

      if (tryParseForPossibleErrs && tryParseForPossibleErrs?.error) {
        errorMsg = "There was a minting error.";

        if (tryParseForPossibleErrs?.errMsg) {
          errorMsg += ` Technical details: ${tryParseForPossibleErrs?.errMsg}`;
        } else {
          errorMsg += ` Technical details: ${tryParseForPossibleErrs?.error}`;
        }

        setErrDataNFTStreamGeneric(new Error(errorMsg));
      } else {
        if (!_imageUrl || _imageUrl.trim() === "" || !_metadataUrl || _metadataUrl.trim() === "") {
          setErrDataNFTStreamGeneric(new Error(labels.ERR_IPFS_ASSET_SAVE_FAILED));
        } else if (!mintMeta || mintMeta?.error || Object.keys(mintMeta).length === 0) {
          setErrDataNFTStreamGeneric(new Error(labels.ERR_MINT_TX_GEN_COMMAND_FAILED));
        } else {
          // let's attempt to checks 3 times if the IPFS data is loaded and available on the gateway
          await checkIfNftImgAndMetadataIsAvailableOnIPFS(_imageUrl, _metadataUrl);

          // let's wait 15 seconds, and then we fetch the user NFTs again as the new NFT should appear
          await sleep(15);

          const _allDataNfts: DasApiAsset[] = await fetchSolNfts(userPublicKey?.toBase58());
          updateAllDataNfts(_allDataNfts);

          // fetchSolNfts(userPublicKey?.toBase58()).then((nfts) => {
          //   updateAllDataNfts(nfts);
          // });

          if (isFreeMint) {
            // in a free mint, we are now done...
            setMintingSuccessful(true);
            setErrDataNFTStreamGeneric(null);
          } else {
            // S: BONDING STEP ------------------->
            // flag that we will also auto vault soon, we do this here so the state changes reflect in UI together
            if (usersNfMeIdVaultBondId === 0) {
              setIsAutoVaultInProgress(true);
            }

            setSaveProgress((prevSaveProgress) => ({ ...prevSaveProgress, s4: 1 }));

            // for the first time user interacts, we need to initialize their rewards PDA
            const initializeAddressTransaction = await getInitAddressBondsRewardsPdaTransaction(connection, userPublicKey);

            if (initializeAddressTransaction) {
              await executeTransaction({ transaction: initializeAddressTransaction, customErrorMessage: "Bonding Program address initialization failed" });
            }

            // const programId = new PublicKey(BONDING_PROGRAM_ID);
            // const addressBondsRewardsPda = PublicKey.findProgramAddressSync([Buffer.from("address_bonds_rewards"), userPublicKey?.toBuffer()], programId)[0];
            // const accountInfo = await connection.getAccountInfo(addressBondsRewardsPda);
            // const isExist = accountInfo !== null;

            // // if no addressBondsRewardsPda was found, this means the user has never minted and bonded on Solana NFMe contract before -- so we first need to "initializeAddress"
            // // ... in this workflow, the user has to sign and submit 2 transactions (initializeAddress and then createBondTransaction)
            // if (!isExist) {
            //   const program = new Program<CoreSolBondStakeSc>(IDL, programId, {
            //     connection,
            //   });

            //   const rewardsConfigPda = PublicKey.findProgramAddressSync([Buffer.from("rewards_config")], programId)[0];
            //   const transactionInitializeAddress = await program.methods
            //     .initializeAddress()
            //     .accounts({
            //       addressBondsRewards: addressBondsRewardsPda,
            //       rewardsConfig: rewardsConfigPda,
            //       authority: userPublicKey,
            //     })
            //     .transaction();

            //   await executeTransaction({ transaction: transactionInitializeAddress, customErrorMessage: "Bonding Program address initialization failed" });
            // }

            // const bondTransaction = await createBondTransaction(mintMeta, userPublicKey, connection);

            const createTxResponse = await createBondTransaction(mintMeta, userPublicKey, connection);

            let nextBondTransaction;

            if (createTxResponse) {
              nextBondTransaction = createTxResponse.transaction;
              setDataNftNonce(createTxResponse.nonce);
              setNextBondId(createTxResponse.bondId);
              setBondTransaction(nextBondTransaction);
            } else {
              setErrDataNFTStreamGeneric(new Error("Could not generate the Data NFT bond transaction."));
            }

            // E: BONDING STEP ------------------->
          }
        }
      }
    } catch (e) {
      console.error(e);
      setErrDataNFTStreamGeneric(new Error(labels.ERR_MINT_TX_GEN_COMMAND_FAILED));
    }
  };

  const sendSolanaBondingTx = async () => {
    if (bondTransaction) {
      try {
        setBondingTxHasFailed(false);

        const bondExeSig = await executeTransaction({ transaction: bondTransaction, customErrorMessage: "Failed to send the bonding transaction" });

        if (bondExeSig) {
          updateItheumBalance(itheumBalance - bondingAmount);

          // User is minting new NFMe IDs, AFTER then have already setup a Vault. So we can end the flow here...
          if (usersNfMeIdVaultBondId > 0) {
            // setMakePrimaryNFMeIdSuccessful(true);
            setErrDataNFTStreamGeneric(null);

            // in solana, the mint was a success already above in the API, but we only consider it a success here if all the steps complete (i.e. mint + bond)
            setMintingSuccessful(true);
          }

          // S: AUTO-VAULT STEP
          // as the bonding is a success, if the usersNfMeIdVaultBondId is 0 and we have nextBondId (which we should always have if the bonding tx was done) -- we can auto vault the bond
          if (usersNfMeIdVaultBondId === 0 && nextBondId) {
            if (userPublicKey && bondingProgram && dataNftNonce) {
              try {
                const bondingProgramIdPubKey = new PublicKey(BONDING_PROGRAM_ID);
                const addressBondsRewardsPda = PublicKey.findProgramAddressSync(
                  [Buffer.from("address_bonds_rewards"), userPublicKey?.toBuffer()],
                  bondingProgramIdPubKey
                )[0];
                const bondConfigPda = PublicKey.findProgramAddressSync(
                  [Buffer.from("bond_config"), Buffer.from([BOND_CONFIG_INDEX])],
                  bondingProgramIdPubKey
                )[0];

                const createTxResponse = await createAddBondAsVaultTransaction(
                  userPublicKey,
                  bondingProgram,
                  addressBondsRewardsPda,
                  bondConfigPda,
                  nextBondId,
                  dataNftNonce
                );

                if (createTxResponse) {
                  const vaultTxSig = await executeTransaction({
                    transaction: createTxResponse.transaction,
                    customErrorMessage: "Failed to make the bond a Vault",
                  });

                  if (!vaultTxSig) {
                    console.error("Error: Vault transaction signature was not returned");
                  }

                  setMintingSuccessful(true);
                  setErrDataNFTStreamGeneric(null);
                } else {
                  console.error("Failed to create the vault bond transaction");
                }
              } catch (err) {
                setErrDataNFTStreamGeneric("Error: Adding the bond as a vault failed");
                console.error(err);
              }
            } else {
              setErrDataNFTStreamGeneric(
                new Error("We should auto vault the last minted data nft, but we could not as we did not have the required parameters")
              );
            }
          }
          // E: AUTO-VAULT STEP
        } else {
          setBondingTxHasFailed(true);
          setErrDataNFTStreamGeneric("Error: Bonding transaction signature was not returned");
        }
      } catch (err) {
        setBondingTxHasFailed(true);
        setErrDataNFTStreamGeneric(new Error(labels.ERR_SUCCESS_MINT_BUT_BONDING_TRANSACTION_FAILED));
        console.error("createBondTransaction failed to sign and send bond transaction", err);
      }
    } else {
      setErrDataNFTStreamGeneric(new Error(labels.ERR_SUCCESS_MINT_BUT_BOND_NOT_CREATED));
      console.error("createBondTransaction failed to create bond transaction");
    }
  };

  async function executeTransaction({ transaction, customErrorMessage = "Transaction failed" }: { transaction: Transaction; customErrorMessage?: string }) {
    try {
      if (!userPublicKey) {
        throw new Error("Wallet not connected");
      }

      const { confirmationPromise, txSignature } = await sendAndConfirmTransaction({ userPublicKey, connection, transaction, sendTransaction });

      toast.promise(
        confirmationPromise.then((response) => {
          if (response.value.err) {
            console.error("Transaction failed:", response.value);
            throw new Error(customErrorMessage);
          }
        }),
        {
          success: {
            title: "Transaction Confirmed",
            description: (
              <a
                href={`${SOLANA_EXPLORER_URL}/tx/${txSignature}?cluster=${networkConfiguration}`}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "underline" }}>
                View on Solana explorer <ExternalLinkIcon margin={3} />
              </a>
            ),
            duration: 12000,
            isClosable: true,
          },
          error: {
            title: customErrorMessage,
            description: (
              <a
                href={`${SOLANA_EXPLORER_URL}/tx/${txSignature}?cluster=${networkConfiguration}`}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "underline" }}>
                View on Solana explorer <ExternalLinkIcon margin={3} />
              </a>
            ),
            duration: 12000,
            isClosable: true,
          },
          loading: { title: "Processing Transaction", description: "Please wait...", colorScheme: "blue" },
        }
      );

      const result = await confirmationPromise;

      if (result.value.err) {
        return false;
      }

      return txSignature;
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: customErrorMessage + " : " + (error as Error).message,
        status: "error",
        duration: 9000,
        isClosable: true,
      });

      throw error;
    }
  }

  const checkIfNftImgAndMetadataIsAvailableOnIPFS = async (_imageUrl: string, _metadataUrl: string) => {
    let assetsLoadedOnIPFSwasSuccess = false;
    let dataNFTTraitsFetched = null;

    for (let tries = 0; tries < 3 && !assetsLoadedOnIPFSwasSuccess; tries++) {
      console.log("Try to fetch the metadata IPFS", tries);

      try {
        await sleep(tries);
        const { result, dataNFTTraitsFromRes } = await confirmIfNftImgAndMetadataIsAvailableOnIPFS(_imageUrl, _metadataUrl);

        assetsLoadedOnIPFSwasSuccess = result;
        dataNFTTraitsFetched = dataNFTTraitsFromRes;
        if (assetsLoadedOnIPFSwasSuccess) {
          break;
        } else {
          await sleep(tries * 5); // wait 10 seconds extra if it's a fail in case IPFS is slow
        }
      } catch (err) {
        setErrDataNFTStreamGeneric(new Error(labels.ERR_IPFS_ASSET_SAVE_FAILED));
      }
    }

    if (assetsLoadedOnIPFSwasSuccess) {
      setSaveProgress((prevSaveProgress) => ({ ...prevSaveProgress, s3: 1 }));
      await sleep(1);

      const imgCIDOnIPFS = _imageUrl.split("ipfs/")[1];
      setDataNFTImg(`https://gateway.pinata.cloud/ipfs/${imgCIDOnIPFS}`);
      setDataNFTTraits(dataNFTTraitsFetched);
    } else {
      setErrDataNFTStreamGeneric(new Error(labels.ERR_IPFS_ASSET_SAVE_FAILED));
    }
  };

  const handleDisabledButtonStep1 = () => {
    return !!errors.dataStreamUrlForm || !!errors.dataPreviewUrlForm || dataNFTStreamUrl === "" || dataNFTPreviewUrl === "";
  };

  const handleDisabledButtonStep2 = () => {
    return (
      !!errors.tokenNameForm ||
      !!errors.datasetDescriptionForm ||
      !!errors.datasetTitleForm ||
      !!errors.numberOfCopiesForm ||
      !!errors.royaltiesForm ||
      !!errors.extraAssets ||
      dataNFTTokenName === "" ||
      datasetTitle === "" ||
      datasetDescription === "" ||
      dataNFTCopies === 0
    );
  };

  // here you can make logic that you want to happen on submit (used for debugging)
  const onSubmit = (data: TradeDataFormType) => {
    console.log(data);
    //TODO refactor this with react form hook
  };

  // unit of time for bonding
  const amountOfTimeUnit = amountOfTime?.unit !== "-1" ? amountOfTime?.unit : "[Failed to fetch - refresh to try again]";

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box mb={10}>
        {isNFMeIDMint && (
          <Box>
            <Flex>
              <Box>
                <Image
                  src={colorMode === "light" ? (isFreeMint ? liteFreeMintNFMeIDHero : liteNFMeIDHero) : isFreeMint ? darkFreeMintNFMeIDHero : darkNFMeIDHero}
                  alt="What is NFMe ID?"
                  rounded="lg"
                />
              </Box>
            </Flex>
          </Box>
        )}

        {PRINT_UI_DEBUG_PANELS && (
          <Box>
            <Alert status="warning" mt={3} p={2} fontSize=".8rem" rounded="md" as="div" style={{ "display": "block" }}>
              <Box>--- Debugging Panel ---</Box>
              <Box>^^ Needs more Itheum to Proceed: {needsMoreITHEUMToProceed.toString()}</Box>
              <Box>^^ Is NFMe ID Mint: {isNFMeIDMint.toString()}</Box>
              <Box>^^ we auto-vault if 0 val on usersNfMeIdVaultBondId : {usersNfMeIdVaultBondId}</Box>
              <Box>Data Stream URL: {dataNFTStreamUrl}</Box>
              <Box>Data Preview URL: {dataNFTPreviewUrl}</Box>
              <Box>Data Marshal URL: {dataNFTMarshalService}</Box>
              <Box>Number of Copies: {dataNFTCopies} (should be - 5)</Box>
              <Box>Royalties: {dataNFTRoyalties} (should be - 2)</Box>
              <Box>Token Name: {dataNFTTokenName} (should be - NFMeIDG1)</Box>
              <Box>Title: {datasetTitle} (should be - NFMe ID)</Box>
              <Box>Description: {datasetDescription}</Box>
              <Box>Solana BONDING_PROGRAM_ID: {BONDING_PROGRAM_ID}</Box>
            </Alert>
          </Box>
        )}

        {activeStep !== 2 && (
          <Flex flexDirection="row" mt="3">
            <Text fontSize="md" color="red.400">
              * &nbsp;Required fields
            </Text>
          </Flex>
        )}

        {!isNFMeIDMint && (
          <Stepper size={{ base: "sm", lg: "lg" }} index={activeStep} my={5} colorScheme="teal">
            {steps.map((step, index) => (
              <Step key={index}>
                <StepIndicator
                  sx={{
                    "[data-status=complete] &": {
                      background: "teal.200",
                      borderColor: "teal.200",
                    },
                    "[data-status=active] &": {
                      background: "transparent",
                      borderColor: "teal.200",
                    },
                    "[data-status=incomplete] &": {
                      background: "#5b5b5b50",
                      borderColor: "transparent",
                    },
                  }}>
                  <StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} />
                </StepIndicator>

                <Box flexShrink="0">
                  <StepTitle>{step.title}</StepTitle>
                  <StepDescription>{step.description}</StepDescription>
                </Box>

                <StepSeparator />
              </Step>
            ))}
          </Stepper>
        )}

        {activeStep === 0 && (
          <Flex flexDirection={"column"}>
            <Text fontWeight="500" color="teal.200" lineHeight="38.4px" fontSize="24px" mt="2 !important" mb={2}>
              Data Asset Detail
            </Text>

            <Link
              color="teal.500"
              fontSize="md"
              mb={7}
              href="https://docs.itheum.io/product-docs/integrators/data-streams-guides/data-asset-storage-options"
              isExternal>
              Where can I store or host my Data Assets? <ExternalLinkIcon mx="2px" />
            </Link>

            <Flex flexDirection="row" gap="7">
              <FormControl isInvalid={!!errors.dataStreamUrlForm} isRequired minH={"6.25rem"}>
                <FormLabel fontWeight="bold" fontSize="md">
                  Data Stream URL
                </FormLabel>

                <Controller
                  control={control}
                  render={({ field: { onChange } }) => (
                    <Input
                      mt="1 !important"
                      placeholder="e.g. https://mydomain.com/my_hosted_file.json"
                      id="dataStreamUrlForm"
                      isDisabled={!!currDataCATSellObj}
                      defaultValue={dataNFTStreamUrl}
                      onChange={(event) => onChange(event.target.value)}
                    />
                  )}
                  name={"dataStreamUrlForm"}
                />
                <FormErrorMessage>{errors?.dataStreamUrlForm?.message} </FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.dataPreviewUrlForm} isRequired minH={{ base: "7rem", md: "6.25rem" }}>
                <FormLabel fontWeight="bold" fontSize="md" noOfLines={1}>
                  Data Preview URL
                </FormLabel>

                <Controller
                  control={control}
                  render={({ field: { onChange } }) => (
                    <Input
                      mt="1 !important"
                      placeholder="e.g. https://mydomain.com/my_hosted_file_preview.json"
                      id="dataPreviewUrlForm"
                      isDisabled={!!currDataCATSellObj}
                      defaultValue={dataNFTPreviewUrl}
                      onChange={(event) => {
                        onChange(event.target.value);
                        trigger("dataPreviewUrlForm");
                      }}
                    />
                  )}
                  name="dataPreviewUrlForm"
                />
                <FormErrorMessage>{errors?.dataPreviewUrlForm?.message}</FormErrorMessage>

                {currDataCATSellObj && (
                  <Link color="teal.500" fontSize="sm" href={dataNFTPreviewUrl} isExternal>
                    View Preview Data <ExternalLinkIcon mx="2px" />
                  </Link>
                )}
              </FormControl>
            </Flex>

            <Text fontWeight="bold" fontSize="md" mt={{ base: "1", md: "5" }}>
              Data Marshal URL
            </Text>

            <Input mt="1 !important" mb={8} value={dataNFTMarshalService} disabled />

            {!!dataNFTMarshalServiceStatus && (
              <Text color="red.400" fontSize="sm" mt="1 !important">
                {dataNFTMarshalServiceStatus}
              </Text>
            )}
            <Flex justifyContent="flex-end" mb={3} mt={5}>
              <Button colorScheme="teal" size="lg" onClick={() => setActiveStep(activeStep + 1)} isDisabled={handleDisabledButtonStep1()}>
                Next
              </Button>
            </Flex>
          </Flex>
        )}

        {activeStep === 1 && (
          <>
            <Text fontWeight="500" color="teal.200" lineHeight="38.4px" fontSize="24px" mt="8 !important" mb={3}>
              NFT Token Metadata
            </Text>

            <Flex flexDirection="row" gap="7" mt={2}>
              <FormControl isInvalid={!!errors.tokenNameForm} isRequired minH={{ base: "7rem", md: "6.25rem" }}>
                <FormLabel fontWeight="bold" fontSize="md" noOfLines={1}>
                  Token Name (Short Title)
                </FormLabel>

                <Controller
                  control={control}
                  render={({ field: { onChange } }) => (
                    <Input
                      mt="1 !important"
                      placeholder="Between 3 and 20 alphanumeric characters only"
                      id="tokenNameForm"
                      defaultValue={dataNFTTokenName}
                      isDisabled={isNFMeIDMint}
                      onChange={(event) => onChange(event.target.value)}
                    />
                  )}
                  name={"tokenNameForm"}
                />
                <FormErrorMessage>{errors?.tokenNameForm?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.datasetTitleForm} isRequired minH={"6.25rem"}>
                <FormLabel fontWeight="bold" fontSize="md">
                  Dataset Title
                </FormLabel>

                <Controller
                  control={control}
                  render={({ field: { onChange } }) => (
                    <Input
                      mt="1 !important"
                      placeholder="Between 10 and 60 alphanumeric characters only"
                      id="datasetTitleForm"
                      defaultValue={datasetTitle}
                      isDisabled={isNFMeIDMint}
                      onChange={(event) => onChange(event.target.value)}
                    />
                  )}
                  name="datasetTitleForm"
                />
                <FormErrorMessage>{errors?.datasetTitleForm?.message}</FormErrorMessage>
              </FormControl>
            </Flex>

            <Flex flexDirection="row" gap={7}>
              <FormControl isInvalid={!!errors.datasetDescriptionForm} isRequired maxW={"48%"}>
                <FormLabel fontWeight="bold" fontSize="md" mt={{ base: "1", md: "4" }} noOfLines={1}>
                  Dataset Description
                </FormLabel>

                <Controller
                  control={control}
                  render={({ field: { onChange } }) => (
                    <Textarea
                      mt="1 !important"
                      h={"70%"}
                      placeholder="Between 10 and 400 characters only. URL allowed."
                      id={"datasetDescriptionForm"}
                      defaultValue={datasetDescription}
                      isDisabled={isNFMeIDMint}
                      onChange={(event) => onChange(event.target.value)}
                    />
                  )}
                  name="datasetDescriptionForm"
                />
                <FormErrorMessage>{errors?.datasetDescriptionForm?.message}</FormErrorMessage>
              </FormControl>
              <Box display="flex" flexDirection="column">
                <FormControl isInvalid={!!errors.numberOfCopiesForm} minH={{ base: "9.75rem", md: "8.25rem" }}>
                  <Text fontWeight="bold" fontSize="md" mt={{ base: "1", md: "4" }}>
                    Number of copies
                  </Text>

                  <Controller
                    control={control}
                    render={({ field: { onChange } }) => (
                      <NumberInput
                        mt="3 !important"
                        size="md"
                        id="numberOfCopiesForm"
                        maxW={24}
                        step={1}
                        defaultValue={dataNFTCopies}
                        isDisabled={isNFMeIDMint}
                        min={0}
                        max={maxSupply > 0 ? maxSupply : 1}
                        isValidCharacter={isValidNumericCharacter}
                        onChange={(event) => {
                          onChange(event);
                          trigger("numberOfCopiesForm");
                        }}>
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    )}
                    name="numberOfCopiesForm"
                  />
                  <Text color="gray.400" fontSize="sm" mt={"1"}>
                    Limit the quantity to increase value (rarity) - Suggested: less than {maxSupply}
                  </Text>
                  <FormErrorMessage>{errors?.numberOfCopiesForm?.message}</FormErrorMessage>
                </FormControl>
              </Box>
            </Flex>

            <FormControl mt={7} isInvalid={!!errors.extraAssets} minH={{ base: "7rem", md: "6.25rem" }}>
              <FormLabel fontWeight="bold" fontSize="md">
                Extra Media Asset URL{" "}
              </FormLabel>

              <PopoverTooltip title="What is an Extra Media Asset?" bodyWidthInPX="350px">
                <>
                  Your Data NFT will automatically get {`it's`} very own unique random NFT image, but you can also choose to have an optional Extra Media Asset
                  (like an image) that will be displayed when your Data NFT is listed. Check it out...{" "}
                  <Image
                    margin="auto"
                    mt="5px"
                    boxSize="auto"
                    w={{ base: "50%", md: "50%" }}
                    src={extraAssetDemo}
                    alt="Extra Media Asset Demo"
                    borderRadius="md"
                  />
                </>
              </PopoverTooltip>

              <Controller
                control={control}
                render={({ field: { onChange } }) => (
                  <Input
                    mt="1 !important"
                    placeholder="e.g. https://ipfs.io/ipfs/CID"
                    id="bonusNFTMediaImgUrlForm"
                    isDisabled={!!currDataCATSellObj}
                    defaultValue={extraAssets}
                    onChange={(event) => onChange(event.target.value)}
                  />
                )}
                name="extraAssets"
              />
              <FormErrorMessage>{errors?.extraAssets?.message}</FormErrorMessage>
            </FormControl>

            <Flex justifyContent="flex-end" gap={3} pt={5} mt={5}>
              <Button size="lg" onClick={() => setActiveStep(activeStep - 1)}>
                Back
              </Button>
              <Flex justifyContent="flex-end">
                <Button colorScheme="teal" size="lg" onClick={() => setActiveStep(activeStep + 1)} isDisabled={handleDisabledButtonStep2()}>
                  Next
                </Button>
              </Flex>
            </Flex>
          </>
        )}

        {activeStep === 2 && (
          <>
            {/* Liveliness Bonding Section */}
            {!isFreeMint && (
              <>
                <Text fontWeight="500" color="teal.200" lineHeight="38.4px" fontSize="24px" mt="8 !important">
                  Liveliness Bonding
                </Text>

                <Flex flexDirection="row">
                  <Heading size="lg" fontSize="22px" mt={3} mb={5} lineHeight="tall">
                    <Highlight
                      query={[`${bondingAmount.toLocaleString()} $ITHEUM`, `${bondingPeriod.toString()} ${amountOfTimeUnit}`, `${maxApy}% Max APR`]}
                      styles={{ px: "2", py: "0", rounded: "full", bg: "teal.200" }}>
                      {`To mint your ${isNFMeIDMint ? "NFMe ID" : "Data NFT"} , you need to bond ${bondingAmount.toLocaleString()} $ITHEUM for ${bondingPeriod.toString()} ${amountOfTimeUnit}. Bonds earn an estimated ${maxApy}% Max APR as staking rewards.`}
                    </Highlight>
                  </Heading>

                  {enableBondingInputForm && (
                    <>
                      <FormControl isInvalid={!!errors.bondingAmount}>
                        <Text fontWeight="bold" fontSize="md" mt={{ base: "1", md: "4" }}>
                          Bonding Amount (in ITHEUM)
                        </Text>

                        <Controller
                          control={control}
                          render={({ field: { onChange } }) => (
                            <NumberInput
                              mt="3 !important"
                              size="md"
                              id="bondingAmount"
                              maxW={24}
                              step={1}
                              defaultValue={bondingAmount}
                              isDisabled
                              min={10}
                              max={maxRoyalties > 0 ? maxRoyalties : 0}
                              isValidCharacter={isValidNumericCharacter}
                              onChange={(event) => onChange(event)}>
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          )}
                          name="bondingAmount"
                        />
                        <FormErrorMessage>{errors?.bondingAmount?.message}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!errors.bondingPeriod}>
                        <Text fontWeight="bold" fontSize="md" mt={{ base: "1", md: "4" }}>
                          Bonding Period ({amountOfTime?.unit !== "-1" ? amountOfTime?.unit : "[Failed to fetch - refresh to try again]"})
                        </Text>
                        <Controller
                          control={control}
                          render={({ field: { onChange } }) => (
                            <NumberInput
                              mt="3 !important"
                              size="md"
                              id="bondingPeriod"
                              maxW={24}
                              step={1}
                              defaultValue={bondingPeriod}
                              isDisabled
                              min={3}
                              isValidCharacter={isValidNumericCharacter}
                              onChange={(event) => onChange(event)}>
                              <NumberInputField />
                            </NumberInput>
                          )}
                          name="bondingPeriod"
                        />
                        <FormErrorMessage>{errors?.bondingPeriod?.message}</FormErrorMessage>
                      </FormControl>
                    </>
                  )}
                </Flex>

                <Box>
                  {itheumBalance < bondingAmount && (
                    <Alert status="error" mt={5} rounded="md" mb={8}>
                      <AlertIcon />
                      <Box>
                        <Text>{labels.ERR_MINT_FORM_NOT_ENOUGH_BOND} </Text>
                        <Text mt="2" fontWeight="bold">
                          You can get some ITHEUM tokens on
                          <Link
                            href="https://raydium.io/swap/?inputMint=sol&outputMint=iTHSaXjdqFtcnLK4EFEs7mqYQbJb6B7GostqWbBQwaV"
                            isExternal
                            textDecoration="underline"
                            _hover={{ textDecoration: "none" }}
                            ml={1}>
                            Raydium here
                          </Link>
                        </Text>
                      </Box>
                    </Alert>
                  )}
                </Box>

                <PopoverTooltip title="Bond $ITHEUM to Prove Reputation" bodyWidthInPX="380px">
                  <>
                    <Text fontSize="md" fontWeight="500" lineHeight="22.4px" mt="3 !important">
                      Bonding ITHEUM tokens proves your {"Liveliness"} and gives Data Consumers confidence about your reputation. You will need to lock the{" "}
                      <Text fontWeight="bold" as="span">
                        Bonding Amount{" "}
                      </Text>
                      for the required{" "}
                      <Text fontWeight="bold" as="span">
                        Bonding Period.{" "}
                      </Text>
                      <br />
                      <br />
                      Your Liveliness Bond is bound by some{" "}
                      <Text fontWeight="bold" as="span">
                        Penalties and Slashing Terms
                      </Text>{" "}
                      as detailed below. At the end of the{" "}
                      <Text fontWeight="bold" as="span">
                        Bonding Period
                      </Text>
                      , you can withdraw your full&nbsp;
                      <Text fontWeight="bold" as="span">
                        Bonding Amount
                      </Text>{" "}
                      OR if you want to continue to signal to Data Consumers that you have good on-chain reputation, you can {`"renew"`} the Liveliness Bond.{" "}
                      <br />
                      <br />
                      But wait, on top of the benefit of having liveliness to prove your reputation, there is more good news, your bonded $ITHEUM also earns
                      Staking APR as it powers your Liveliness reputation!{" "}
                      <Link
                        href="https://docs.itheum.io/product-docs/product/liveliness-on-chain-reputation/liveliness-staking-guide"
                        isExternal
                        rel="noreferrer"
                        color="teal.200">
                        Learn more
                      </Link>
                    </Text>
                  </>
                </PopoverTooltip>

                <Box minH={{ base: "5rem", md: "3.5rem" }}>
                  <Flex mt="3 !important">
                    <Button
                      colorScheme="teal"
                      borderRadius="12px"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open("https://docs.itheum.io/product-docs/legal/ecosystem-tools-terms/liveliness-bonding-penalties-and-slashing-terms")
                      }>
                      <Text color={colorMode === "dark" ? "bgWhite" : "black"} px={2}>
                        Read Liveliness Bonding: Penalties and Slashing Terms
                      </Text>
                    </Button>
                  </Flex>

                  <Checkbox size="md" mt="3 !important" isChecked={readLivelinessBonding} onChange={(e) => setReadLivelinessBonding(e.target.checked)}>
                    I have read and I agree to Liveliness Bonding: Penalties and Slashing Terms
                  </Checkbox>

                  {!readLivelinessBonding && showInlineErrorsBeforeAction && (
                    <Text color="red.400" fontSize="sm" mt="1 !important">
                      You need to agree to Liveliness Bonding: Penalties and Slashing Terms to proceed with your mint.
                    </Text>
                  )}
                </Box>

                <Text fontWeight="500" color="teal.200" lineHeight="38.4px" fontSize="24px" mt="48px !important">
                  Minting Terms of Use
                </Text>
              </>
            )}

            {!isNFMeIDMint && (
              <PopoverTooltip title="Terms of use for Minting a Data NFT">
                <>
                  <Text fontSize="md" fontWeight="500" lineHeight="22.4px" mt="3 !important">
                    Minting a Data NFT and putting it for trade on the Data DEX means you have to agree to some strict “terms of use”, as an example, you agree
                    that the data is free of any illegal material and that it does not breach any copyright laws. <br />
                    <br />
                    You also agree to make sure the Data Stream URL is always online. Given it&apos;s an NFT, you also have limitations like not being able to
                    update the title, description, royalty, etc. But there are other conditions too. <br />
                    <br />
                    Take some time to read these “terms of use” before you proceed and it&apos;s critical you understand the terms of use before proceeding.
                  </Text>
                </>
              </PopoverTooltip>
            )}

            <Flex mt="3 !important">
              <Button
                colorScheme="teal"
                borderRadius="12px"
                variant="outline"
                size="sm"
                onClick={() => window.open("https://docs.itheum.io/product-docs/legal/ecosystem-tools-terms/datadex/terms-of-use")}>
                <Text color={colorMode === "dark" ? "bgWhite" : "black"} px={2}>
                  Read Minting Terms of Use
                </Text>
              </Button>
            </Flex>

            <Box minH={{ base: "5rem", md: "3.5rem" }}>
              <Checkbox size="md" mt="3 !important" isChecked={readTermsChecked} onChange={(e) => setReadTermsChecked(e.target.checked)}>
                I have read and I agree to the Terms of Use
              </Checkbox>

              {!readTermsChecked && showInlineErrorsBeforeAction && (
                <Text color="red.400" fontSize="sm" mt="1 !important" minH={"20px"}>
                  Please read and agree to Terms of Use to proceed with your mint.
                </Text>
              )}
            </Box>

            {userPublicKey ? (
              <Alert status="warning" rounded="md">
                <AlertIcon />
                All Data NFTs, including NFMeIDs minted, will include a fixed 5% royalty. <br /> These royalties are split equally 50% / 50% with you and the
                Itheum Protocol.
              </Alert>
            ) : (
              <>
                {" "}
                <Text fontWeight="500" color="teal.200" lineHeight="38.4px" fontSize="24px" mt="30px !important">
                  Anti-Spam Fee
                </Text>
                <PopoverTooltip title="What is the Anti-Spam Fee">
                  <>
                    <Text fontSize="md" fontWeight="500" lineHeight="22.4px" mt="3 !important">
                      An {"anti-spam fee"} is necessary to prevent excessive concurrent mints from overwhelming the Data DEX. The fees are collected and
                      redistributed back to Data Creators as Liveliness staking rewards or burned
                    </Text>
                  </>
                </PopoverTooltip>
                <Box mt="3 !important">
                  <Tag variant="solid" bgColor="#00C7971A" borderRadius="sm">
                    <Text px={2} py={2} color="teal.200" fontWeight="500">
                      Anti-Spam Fee is currently {antiSpamTax < 0 ? "?" : antiSpamTax} ITHEUM tokens{" "}
                    </Text>
                  </Tag>
                </Box>
                {itheumBalance < antiSpamTax && (
                  <Text color="red.400" fontSize="sm" mt="1 !important">
                    {labels.ERR_MINT_FORM_NOT_ENOUGH_TAX}
                  </Text>
                )}
                <Box minH={{ base: "5rem", md: "3.5rem" }}>
                  <Checkbox size="md" mt="3 !important" isChecked={readAntiSpamFeeChecked} onChange={(e) => setReadAntiSpamFeeChecked(e.target.checked)}>
                    I accept the deduction of the Anti-Spam Minting Fee from my wallet
                  </Checkbox>

                  {!readAntiSpamFeeChecked && showInlineErrorsBeforeAction && (
                    <Text color="red.400" fontSize="sm" mt="1 !important">
                      You need to agree to Anti-Spam Minting deduction to proceed with your mint.
                    </Text>
                  )}
                </Box>{" "}
              </>
            )}

            {userPublicKey && solBondingConfigObtainedFromChainErr && (
              <Alert status="error" rounded="md" mt="2">
                <AlertIcon />
                {labels.ERR_SOL_CANT_GET_ONCHAIN_CONFIG}
              </Alert>
            )}

            <Flex>
              <Button
                mt="10"
                colorScheme="teal"
                isLoading={isMintingModalOpen}
                onClick={() => {
                  if (isNFMeIDMint) {
                    dataNFTSellSubmit();
                  } else {
                    // For solana, as there are a few steps involved when minting and bonding, lets inform the user what to expect next
                    setSolNFMeIDMintConfirmationWorkflow(true);
                  }
                }}
                isDisabled={shouldMintYourDataNftBeDisabled()}>
                {isNFMeIDMint ? "Mint Your NFMe ID" : "Mint Your Data NFT Collection"}
              </Button>
            </Flex>

            <MintingModal
              isOpen={isMintingModalOpen}
              setIsOpen={setIsMintingModalOpen}
              errDataNFTStreamGeneric={errDataNFTStreamGeneric}
              saveProgress={saveProgress}
              dataNFTImg={dataNFTImg}
              dataNFTTraits={dataNFTTraits}
              closeProgressModal={closeProgressModal}
              mintingSuccessful={mintingSuccessful}
              // makePrimaryNFMeIdSuccessful={makePrimaryNFMeIdSuccessful}
              isNFMeIDMint={isNFMeIDMint}
              isAutoVaultInProgress={isAutoVaultInProgress}
              bondingTxHasFailed={bondingTxHasFailed}
              sendSolanaBondingTx={sendSolanaBondingTx}
              isFreeMint={isFreeMint}
            />
          </>
        )}
      </Box>

      <>
        <ConfirmationDialog
          isOpen={solNFMeIDMintConfirmationWorkflow}
          onCancel={() => {
            setSolNFMeIDMintConfirmationWorkflow(false);
          }}
          onProceed={() => {
            setSolNFMeIDMintConfirmationWorkflow(false);
            dataNFTSellSubmit();
          }}
          bodyContent={
            <>
              <Text mb="5">1. You may be asked to sign a message to verify your wallet (no gas required).</Text>
              <Text mt="5">2. (First-time minting only) Sign a transaction to prepare your Liveliness bond.</Text>
              <Text mt="5">3. Sign a transaction to bond $ITHEUM and activate your NFMe ID for staking rewards.</Text>
              <Text mt="5">4. (First-time minting only) Sign a transaction to upgrade bond to a vault.</Text>
              <Text fontWeight="bold" fontSize="md" color="teal.200" mt={5}>
                Please complete all the steps above for a successful NFMe ID mint and bonding.
              </Text>{" "}
            </>
          }
          dialogData={{
            title: "Next Steps for Minting Your NFMe ID. ",
            proceedBtnTxt: "I'm Ready, Let's Mint My NFMe ID",
            cancelBtnText: "Cancel and Close",
          }}
        />
      </>
    </form>
  );
};
