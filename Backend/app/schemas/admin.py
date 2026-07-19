from pydantic import BaseModel


class DepartmentCreate(BaseModel):
    name: str


class DepartmentUpdate(BaseModel):
    name: str


class DepartmentOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class YearCreate(BaseModel):
    name: str
    department_id: int


class YearUpdate(BaseModel):
    name: str | None = None
    department_id: int | None = None


class YearOut(BaseModel):
    id: int
    name: str
    department_id: int

    model_config = {"from_attributes": True}


class SectionCreate(BaseModel):
    name: str
    year_id: int


class SectionUpdate(BaseModel):
    name: str | None = None
    year_id: int | None = None


class SectionOut(BaseModel):
    id: int
    name: str
    year_id: int

    model_config = {"from_attributes": True}
