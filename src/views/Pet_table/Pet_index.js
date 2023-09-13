
import { useState, useEffect, createRef } from "react";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router";
import { AddBox, Edit, Visibility } from "@material-ui/icons";
import MuiTable from "../../components/table/table_index";
import { BASE_URL, PATH_PET } from "../../utils/constants";
import { PATH_PETOWNER } from "../../utils/constants";
import { PATH_VISIT } from "../../utils/constants";
import makeApiCall from "../../utils/makeApiCall";

function PetTable() {

  const tableRef = createRef();
  const snackbar = useSnackbar();
  const navigate =  useNavigate();



  const [PetOwners, setPetOwners] = useState({});

  useEffect(() => {
    const fetchPetOwners = async () => {
      const typesResponse = await makeApiCall(
        `${BASE_URL}${PATH_PETOWNER}`
      );
      const jsonResp = await typesResponse.json();

      if (Array.isArray(jsonResp.value) && jsonResp.value.length > 0) {
        const types = {};
        jsonResp.value.forEach((item) => {
          types[`${item.Pet_ownerId}`] = item.PetOwnername
        });
        setPetOwners(types);
      } else {
        snackbar.enqueueSnackbar("No data for PetOwners. Please Add PetOwners First.", {
          variant: "warning",
        });
	setPetOwners({});
      }
    };
    fetchPetOwners();
  }, []);


  const [Visits, setVisits] = useState({});

  useEffect(() => {
    const fetchVisits = async () => {
      const typesResponse = await makeApiCall(
        `${BASE_URL}${PATH_VISIT}`
      );
      const jsonResp = await typesResponse.json();

      if (Array.isArray(jsonResp.value) && jsonResp.value.length > 0) {
        const types = {};
        jsonResp.value.forEach((item) => {
          types[`${item.Visit_id}`] = item.VetName
        });
        setVisits(types);
      } else {
        snackbar.enqueueSnackbar("No data for Visits. Please Add Visits First.", {
          variant: "warning",
        });
	setVisits({});
      }
    };
    fetchVisits();
  }, []);

  const columns = [
      { title: "PetName", field: "PetName" },
      { title: "PetGender", field: "PetGender" },
      { title: "Breed", field: "Breed" },
      { title: "Owns", field: "PetOwns", lookup: PetOwners },
      { title: "Visits", field: "PetVisits", lookup: Visits },
  ];
  
  const fetchData = async (query) => {
    return new Promise(async (resolve, reject) => {
      const { page, orderBy, orderDirection, search, pageSize } = query;
      const url = `${BASE_URL}${PATH_PET}`;
      let temp = url; // Initialize with the base URL
      let filterQuery = ""; // Initialize filter query as an empty string
  
      // Handle sorting
      if (orderBy) {
        temp += `?$orderby=${orderBy.field} ${orderDirection}`;
      }
  
      // Handle searching
      if (search) {
        filterQuery = `$filter=contains($screen.getSearchField().getName(), '${search}')`;
        temp += orderBy ? `&${filterQuery}` : `?${filterQuery}`;
      }
  
      // Handle pagination
      if (page > 0) {
        const skip = page * pageSize;
        temp += orderBy || search ? `&$skip=${skip}` : `?$skip=${skip}`;
      }
  
      const countUrl = search ? `${url}/$count?${filterQuery}` : `${BASE_URL}${PATH_PET}/$count`;
      let total = null;

      try {
        const countResponse = await makeApiCall(countUrl);
        const e = await countResponse.text();
        total = parseInt(e, 10);
  
        const response = await makeApiCall(temp);
        const { value } = await response.json();
  
        if (value.length === 0) {
          return resolve({
            data: [],
            page: page,
            totalCount: 0,
            error: "Error fetching data"
          });
        } else {
          return resolve({
            data: value,
            page: page,
            totalCount: total,
          });
        }
      } catch (error) {
        snackbar.enqueueSnackbar(`Trips API call Failed! - ${error.message}`, {
          variant: "error",
        });
        console.error("API call failed:", error);
        reject(error);
      }
    });
  };

  return (
    <div className="product-container">
      <MuiTable
        tableRef={tableRef}
        title="Pet-Dogs"
        cols={columns}
        data={fetchData}
        size={5}
        actions={[
          {
            icon: AddBox,
            tooltip: "Add",
            onClick: () => navigate("/Pets/create"),
            isFreeAction: true,
          },
          {
            icon: Visibility,
            tooltip: "View",
            onClick: (event, rowData) =>
            navigate(`/Pets/view/${rowData.Pet_id}`),
          },
          {
            icon: Edit,
            tooltip: "Edit",
            onClick: (event, rowData) =>
            navigate(`/Pets/edit/${rowData.Pet_id}`),
          },
        ]}
        onRowDelete={async (oldData) => {
          const resp = await makeApiCall(
            `${BASE_URL}${PATH_PET}(${oldData.Pet_id})`,
            "DELETE"
          );
          if (resp.ok) {
            tableRef.current.onQueryChange();
            snackbar.enqueueSnackbar("Successfully deleted Pets", {
              variant: "success",
            });
          } else {
            const jsonData = await resp.json();
            snackbar.enqueueSnackbar(`Failed! - ${jsonData.message}`, {
              variant: "error",
            });
          }
        }}
      />
    </div>
  );
}

export default PetTable;
