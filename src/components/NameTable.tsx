"use client";
import { useMemo, useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "./ui/pagination";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

import { Button } from "./ui/button";
import Link from "next/link";

import { Label } from "./ui/label";
import { Address } from "viem";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

import { EnableModal } from "./EnableModal";
import { CaretRightIcon, CheckIcon } from "@radix-ui/react-icons";

type NameTableProps = {
  names: Name[];
  selectedName: string;
  onSelectName: (name: string) => void;
};

const options: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

type Name = {
  name: string;
  resolver?: string;
  status?: boolean;
  parentName?: string;
  owner?: Address;
  resolvedAddress?: Address;
  createdAt?: {
    date: string;
    value: number;
  };
  expiryDate?: {
    date: string;
    value: number;
  };
};

export default function NameTable({
  names,
  selectedName,
  onSelectName,
}: NameTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const handleRowClick = (name: string) => {
    onSelectName(name);
  };
  const currentTimestamp = Math.floor(Date.now());
  const filteredNames = names.filter(
    (name) => name.expiryDate && name.expiryDate.value >= currentTimestamp
  );
  const displayedNames = useMemo(() => {
    // First, sort the names by status, true first
    const sortedNames = filteredNames.sort((a, b) => {
      // Assuming status can only be true or false
      return (b.status === true ? 1 : 0) - (a.status === true ? 1 : 0);
    });

    // Then, slice the sorted array for pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedNames.slice(startIndex, endIndex);
  }, [filteredNames, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredNames.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const emptyRows = itemsPerPage - displayedNames.length;

  return (
    <div className="flex text-white flex-col h-full ">
      <RadioGroup value={selectedName} onValueChange={onSelectName}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-neutral-800">
              <TableHead className="pl-[36px] text-neutral-300">Name</TableHead>
              <TableHead className=" text-neutral-300">Expiration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedNames.map((name) => (
              <TableRow
                className={`h-10 cursor-pointer   ${
                  selectedName === name.name
                    ? " bg-neutral-700   text-emerald-400  "
                    : ""
                }`}
                key={name.name}
                onMouseDown={() => handleRowClick(name.name)}
              >
                <TableCell
                  className={`flex  min-w-40 sm:min-w-96 grow  justify-start`}
                >
                  {name.status && (
                    <Image
                      width={20}
                      height={20}
                      src="icon-lightning.svg"
                      alt="offchain"
                    />
                  )}
                  <span
                    className={`font-medium  ${
                      name.status ? "ml-2" : "ml-[28px]"
                    }`}
                  >
                    {" "}
                    {name.name}
                  </span>
                </TableCell>

                <TableCell className="flex-1  ">
                  {name.expiryDate
                    ? new Date(name.expiryDate.value).toLocaleDateString(
                        undefined,
                        options
                      )
                    : ""}
                </TableCell>
              </TableRow>
            ))}
            {emptyRows > 0 &&
              Array.from({ length: emptyRows }).map((_, index) => (
                <TableRow
                  className="h-10 hover:bg-neutral-800 "
                  key={`empty-${index}`}
                >
                  <TableCell>&nbsp;</TableCell>
                  <TableCell>&nbsp;</TableCell>
                  <TableCell>&nbsp;</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </RadioGroup>
      {/* Pagination */}
      <div className="flex justify-between mt-8">
        <div className="max-w-full">
          <Pager
            totalPages={totalPages}
            currentPage={currentPage}
            handlePageChange={handlePageChange}
          />
        </div>

        <div className="flex">
          <Button disabled={selectedName == ""} className="w-32">
            {" "}
            <Link href={`/manage?name=${selectedName}`}>Manage Name</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

const Pager = ({
  totalPages,
  currentPage,
  handlePageChange,
}: {
  totalPages: number;
  currentPage: number;
  handlePageChange: (page: number) => void;
}) => {
  const getPageNumbers = () => {
    const pageNumbers = [];
    const delta = 1; // Number of adjacent pages to show

    if (totalPages <= 7) {
      // If there are 7 or fewer pages, show all of them
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include 1, 2, 3, 4 if current page is 1, 2, or 3
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        if (totalPages > 6) pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
      // Always include last 4 pages if current page is within last 3 pages
      else if (currentPage > totalPages - 3) {
        pageNumbers.push(1);
        if (totalPages > 6) pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      }
      // Otherwise, show current page with adjacent pages
      else {
        pageNumbers.push(1);
        if (currentPage - delta > 2) pageNumbers.push("...");
        for (
          let i = Math.max(2, currentPage - delta);
          i <= Math.min(totalPages - 1, currentPage + delta);
          i++
        ) {
          pageNumbers.push(i);
        }
        if (currentPage + delta < totalPages - 1) pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  return (
    <Pagination className="max-w-full flex-wrap">
      <PaginationContent>
        {getPageNumbers().map((pageNumber, index) => (
          <PaginationItem key={index} className="cursor-pointer">
            {pageNumber === "..." ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onMouseDown={() => handlePageChange(pageNumber as number)}
                className={currentPage === pageNumber ? "bg-neutral-600" : ""}
              >
                {pageNumber}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
      </PaginationContent>
    </Pagination>
  );
};
